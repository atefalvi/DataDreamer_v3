"""Owner-only local file ingestion — PDF / Markdown / plain text → pgvector.

Runs INSIDE the container (never exposed as an HTTP endpoint):

  python -m orby.ingest_files add notes.pdf --scope team --category methodology
  python -m orby.ingest_files add maria-cv.pdf --scope person \\
      --person-slug maria-khan --person-name "Maria Khan" --title "Maria Khan — CV"
  python -m orby.ingest_files list
  python -m orby.ingest_files disable <id-or-checksum>
  python -m orby.ingest_files delete  <id-or-checksum>

Everything is local: pypdf extraction, Ollama embeddings, pgvector storage — no
external document/AI service ever sees the content. Extracted text is untrusted
DATA (same delimiter policy as web content at answer time); scope=person requires
explicit --person-slug/--person-name — identity is never guessed from a filename.
Duplicate files (same sha256) are skipped unless --replace.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import sys
from dataclasses import dataclass
from pathlib import Path

from . import db, ollama
from .config import loader
from .guardrails import chunk_text, strip_markup
from .settings import settings

MAX_BYTES = 20 * 1024 * 1024
MAX_PDF_PAGES = 300
ALLOWED = {".pdf", ".md", ".txt"}


@dataclass
class ValidationError(Exception):
    reason: str

    def __str__(self) -> str:  # pragma: no cover
        return self.reason


def validate_file(path: Path, data: bytes) -> str:
    """Return the normalized kind ('pdf'|'md'|'txt') or raise ValidationError.

    Checks: extension allow-list, size, magic bytes, and text sanity (UTF-8, no
    NULs, no embedded HTML/script — those belong to the rejected-formats list).
    """
    ext = path.suffix.lower()
    if ext not in ALLOWED:
        raise ValidationError(f"unsupported extension '{ext}' (allowed: pdf, md, txt)")
    if len(data) == 0:
        raise ValidationError("empty file")
    if len(data) > MAX_BYTES:
        raise ValidationError(f"too large ({len(data) // (1024 * 1024)} MB > {MAX_BYTES // (1024 * 1024)} MB)")

    if ext == ".pdf":
        if not data.startswith(b"%PDF-"):
            raise ValidationError("not a real PDF (magic bytes mismatch)")
        return "pdf"

    if b"\x00" in data:
        raise ValidationError("binary content in a text file")
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError as error:
        raise ValidationError("not valid UTF-8 text") from error
    lowered = text.lower()
    if "<script" in lowered or "<iframe" in lowered or lowered.lstrip().startswith("<!doctype html"):
        raise ValidationError("HTML/script content is not accepted")
    return "md" if ext == ".md" else "txt"


def extract_text(kind: str, data: bytes) -> str:
    if kind == "pdf":
        from io import BytesIO

        from pypdf import PdfReader

        reader = PdfReader(BytesIO(data))
        if reader.is_encrypted:
            raise ValidationError("encrypted PDFs are not accepted")
        if len(reader.pages) > MAX_PDF_PAGES:
            raise ValidationError(f"PDF has {len(reader.pages)} pages (max {MAX_PDF_PAGES})")
        pages = []
        for number, page in enumerate(reader.pages, start=1):
            page_text = (page.extract_text() or "").strip()
            if page_text:
                pages.append(f"[Page {number}]\n{page_text}")
        text = "\n\n".join(pages)
    else:
        text = data.decode("utf-8")
        if kind == "md":
            text = strip_markup(text)
    if len(text.strip()) < 40:
        raise ValidationError("no extractable text (scanned/image-only PDFs are not supported)")
    return text


async def _resolve(database, ref: str):
    return await database.fetchrow(
        "SELECT id, title, active FROM knowledge_documents"
        " WHERE source_collection='file' AND (source_id = $1 OR id::text = $1)",
        ref,
    )


async def cmd_add(args) -> int:
    if args.scope == "person" and not (args.person_slug and args.person_name):
        print("error: --scope person requires --person-slug and --person-name (identity is never guessed)")
        return 1

    cfg = await loader.get()
    probe = await ollama.embed("dimension probe", cfg.embedding_model)
    if len(probe) != settings.embedding_dim:
        print(f"error: embedding model outputs {len(probe)} dims, database column is {settings.embedding_dim}")
        return 1

    database = await db.pool()
    failures = 0
    for raw_path in args.paths:
        path = Path(raw_path)
        try:
            data = path.read_bytes()
        except OSError as error:
            print(f"✗ {path.name}: {error}")
            failures += 1
            continue
        try:
            kind = validate_file(path, data)
            checksum = hashlib.sha256(data).hexdigest()

            existing = await _resolve(database, checksum)
            if existing and not args.replace:
                print(f"= {path.name}: duplicate of '{existing['title']}' (use --replace to reprocess)")
                continue
            if existing:
                await database.execute("DELETE FROM knowledge_documents WHERE id=$1", existing["id"])

            text = extract_text(kind, data)
            document_id = await database.fetchval(
                "INSERT INTO knowledge_documents (source_collection, source_id, title, url,"
                " author_slug, author_name, content_type, checksum, scope)"
                " VALUES ('file',$1,$2,'',$3,$4,$5,$6,$7) RETURNING id",
                checksum,
                args.title or path.stem.replace("-", " ").replace("_", " ").strip().title(),
                args.person_slug,
                args.person_name,
                args.category or kind,
                checksum,
                args.scope,
            )
            chunks = chunk_text(text, cfg.chunk_size, cfg.chunk_overlap)
            for index, chunk in enumerate(chunks):
                embedding = await ollama.embed(chunk, cfg.embedding_model)
                await database.execute(
                    "INSERT INTO knowledge_chunks (document_id, chunk_index, content, embedding)"
                    " VALUES ($1,$2,$3,$4)",
                    document_id, index, chunk, "[" + ",".join(f"{x:.7f}" for x in embedding) + "]",
                )
            print(f"+ {path.name}: {len(chunks)} chunk(s), scope={args.scope}"
                  + (f", person={args.person_slug}" if args.person_slug else ""))
        except ValidationError as error:
            print(f"✗ {path.name}: rejected — {error.reason}")
            failures += 1
        except Exception as error:  # noqa: BLE001 — one bad file must not stop the batch
            print(f"✗ {path.name}: failed — {type(error).__name__}: {error}")
            failures += 1
    return 1 if failures else 0


async def cmd_list(_args) -> int:
    database = await db.pool()
    rows = await database.fetch(
        "SELECT d.id, d.title, d.scope, d.author_slug, d.content_type, d.active,"
        " d.updated_at, count(c.id) AS chunks, d.source_id AS checksum"
        " FROM knowledge_documents d LEFT JOIN knowledge_chunks c ON c.document_id = d.id"
        " WHERE d.source_collection = 'file'"
        " GROUP BY d.id ORDER BY d.updated_at DESC",
    )
    if not rows:
        print("no ingested files")
        return 0
    for row in rows:
        flag = "on " if row["active"] else "OFF"
        person = f" person={row['author_slug']}" if row["author_slug"] else ""
        print(f"[{flag}] {row['title']} | scope={row['scope']}{person} | {row['chunks']} chunks"
              f" | {row['checksum'][:12]}… | id={row['id']}")
    return 0


async def cmd_set_active(args, active: bool) -> int:
    database = await db.pool()
    row = await _resolve(database, args.ref)
    if not row:
        print(f"not found: {args.ref}")
        return 1
    await database.execute("UPDATE knowledge_documents SET active=$2 WHERE id=$1", row["id"], active)
    print(f"{'enabled' if active else 'disabled'}: {row['title']}")
    return 0


async def cmd_delete(args) -> int:
    database = await db.pool()
    row = await _resolve(database, args.ref)
    if not row:
        print(f"not found: {args.ref}")
        return 1
    await database.execute("DELETE FROM knowledge_documents WHERE id=$1", row["id"])
    print(f"deleted: {row['title']} (chunks cascade)")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="orby.ingest_files")
    sub = parser.add_subparsers(dest="command", required=True)

    add = sub.add_parser("add", help="ingest one or more files")
    add.add_argument("paths", nargs="+")
    add.add_argument("--scope", choices=["site", "team", "person"], default="site")
    add.add_argument("--person-slug")
    add.add_argument("--person-name")
    add.add_argument("--category", help="content_type label, e.g. methodology, cv, profile")
    add.add_argument("--title")
    add.add_argument("--replace", action="store_true", help="reprocess even if the checksum already exists")

    sub.add_parser("list", help="list ingested files")
    for name in ("disable", "enable", "delete"):
        cmd = sub.add_parser(name)
        cmd.add_argument("ref", help="document id or sha256 checksum")
    return parser


async def _main() -> int:
    args = build_parser().parse_args()
    await db.migrate()
    try:
        if args.command == "add":
            return await cmd_add(args)
        if args.command == "list":
            return await cmd_list(args)
        if args.command == "disable":
            return await cmd_set_active(args, False)
        if args.command == "enable":
            return await cmd_set_active(args, True)
        if args.command == "delete":
            return await cmd_delete(args)
        return 1
    finally:
        await db.close()


if __name__ == "__main__":
    sys.exit(asyncio.run(_main()))
