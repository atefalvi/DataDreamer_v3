"""Knowledge ingestion — published DataDreamer content → pgvector.

Reads ONLY published rows through the read-only Orby token. Gated guide item
bodies and curator annotations are deliberately never fetched: Orby must not
leak login-only content to anonymous visitors (ADR D6).

Run inside the container:  python -m orby.ingest            (incremental)
                           python -m orby.ingest --full     (drop + rebuild)
Checksum-based upsert: unchanged documents are skipped; unpublished/deleted
sources are deactivated. Never exposed as a public endpoint.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import logging

import httpx

from . import db, ollama
from .config import loader
from .guardrails import chunk_text, strip_markup
from .settings import settings

log = logging.getLogger("orby.ingest")

SITE = "https://data-dreamer.net"


async def _directus(path: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(
            f"{settings.directus_url}{path}",
            headers={"Authorization": f"Bearer {settings.directus_token}"},
        )
        response.raise_for_status()
        return response.json()["data"]


async def fetch_sources() -> list[dict]:
    """Every approved source as {collection, id, title, url, author, type, published, text}."""
    sources: list[dict] = []

    posts = await _directus(
        "/items/posts?filter[status][_eq]=published&limit=200"
        "&fields=id,slug,title,excerpt,content,published_at,author.slug,author.display_name,topics.topics_id.name"
    )
    for post in posts:
        topics = ", ".join(t["topics_id"]["name"] for t in post.get("topics") or [] if t.get("topics_id"))
        sources.append({
            "collection": "posts", "id": str(post["id"]), "title": post["title"],
            "url": f"{SITE}/blog/{post['slug']}",
            "author_slug": (post.get("author") or {}).get("slug"),
            "author_name": (post.get("author") or {}).get("display_name"),
            "content_type": "article", "published_at": post.get("published_at"),
            "text": f"{post['title']}\n\n{post.get('excerpt') or ''}\n\nTopics: {topics}\n\n{post.get('content') or ''}",
        })

    projects = await _directus(
        "/items/projects?filter[status][_eq]=published&limit=200"
        "&fields=id,slug,title,summary,body,year,role,tags,author.slug,author.display_name"
    )
    for project in projects:
        tags = ", ".join(project.get("tags") or [])
        sources.append({
            "collection": "projects", "id": str(project["id"]), "title": project["title"],
            "url": f"{SITE}/projects/{project['slug']}",
            "author_slug": (project.get("author") or {}).get("slug"),
            "author_name": (project.get("author") or {}).get("display_name"),
            "content_type": "case-study", "published_at": None,
            "text": f"{project['title']} ({project.get('year')})\n\n{project.get('summary') or ''}\n\nRole: {project.get('role') or ''}. Stack: {tags}\n\n{project.get('body') or ''}",
        })

    guides = await _directus(
        "/items/guides?filter[status][_eq]=published&limit=100"
        "&fields=id,slug,title,summary,why_this_path,expected_outcome,recommended_audience,difficulty,"
        "author.slug,author.display_name,sections.title,sections.description,sections.items.title,sections.items.description"
    )
    for guide in guides:
        outline = []
        for section in guide.get("sections") or []:
            outline.append(f"Section: {section.get('title')}. {section.get('description') or ''}")
            for item in section.get("items") or []:
                # titles + public descriptions only — gated bodies/urls are never fetched
                outline.append(f"- {item.get('title')}: {item.get('description') or ''}")
        sources.append({
            "collection": "guides", "id": str(guide["id"]), "title": guide["title"],
            "url": f"{SITE}/guides/{guide['slug']}",
            "author_slug": (guide.get("author") or {}).get("slug"),
            "author_name": (guide.get("author") or {}).get("display_name"),
            "content_type": "field-guide", "published_at": None,
            "text": (
                f"{guide['title']} — a DataDreamer Field Guide ({guide.get('difficulty')}).\n\n"
                f"{guide.get('summary') or ''}\n\nWhy this path: {guide.get('why_this_path') or ''}\n\n"
                f"Expected outcome: {guide.get('expected_outcome') or ''}\n\n"
                f"Audience: {guide.get('recommended_audience') or ''}\n\nSyllabus:\n" + "\n".join(outline)
            ),
        })

    authors = await _directus(
        "/items/authors?filter[status][_eq]=published&limit=100"
        "&fields=id,slug,display_name,role_title,bio,statement,tools,dream_team,"
        "specialties.specialties_id.name"
    )
    for author in authors:
        specialties = ", ".join(
            s["specialties_id"]["name"] for s in author.get("specialties") or [] if s.get("specialties_id")
        )
        team = "a Dream Team member" if author.get("dream_team") else "a DataDreamer contributor"
        sources.append({
            "collection": "authors", "id": str(author["id"]), "title": author["display_name"],
            "url": f"{SITE}/dream-team/{author['slug']}" if author.get("dream_team") else f"{SITE}/blog?author={author['slug']}",
            "author_slug": author["slug"], "author_name": author["display_name"],
            "content_type": "contributor", "published_at": None,
            "text": (
                f"{author['display_name']} is {team} — {author.get('role_title') or ''}.\n\n"
                f"{author.get('statement') or ''}\n\n{author.get('bio') or ''}\n\n"
                f"Specialties: {specialties}. Tools: {', '.join(author.get('tools') or [])}."
            ),
        })

    return sources


async def run(full: bool = False) -> dict:
    cfg = await loader.get()
    database = await db.pool()

    # Refuse to embed into a column of the wrong size (ADR: dimension is env-pinned).
    probe = await ollama.embed("dimension probe", cfg.embedding_model)
    if len(probe) != settings.embedding_dim:
        raise SystemExit(
            f"embedding model '{cfg.embedding_model}' outputs {len(probe)} dims but the "
            f"database column is vector({settings.embedding_dim}). Set ORBY_EMBEDDING_DIM "
            "and re-migrate (full re-embed) before ingesting."
        )

    if full:
        await database.execute("DELETE FROM knowledge_documents")

    sources = await fetch_sources()
    seen: set[tuple[str, str]] = set()
    stats = {"unchanged": 0, "updated": 0, "created": 0, "deactivated": 0, "chunks": 0}

    for source in sources:
        seen.add((source["collection"], source["id"]))
        text = strip_markup(source["text"])
        checksum = hashlib.sha256(text.encode()).hexdigest()
        existing = await database.fetchrow(
            "SELECT id, checksum FROM knowledge_documents WHERE source_collection=$1 AND source_id=$2",
            source["collection"], source["id"],
        )
        if existing and existing["checksum"] == checksum:
            await database.execute("UPDATE knowledge_documents SET active=true WHERE id=$1", existing["id"])
            stats["unchanged"] += 1
            continue

        if existing:
            document_id = existing["id"]
            await database.execute(
                "UPDATE knowledge_documents SET title=$2, url=$3, author_slug=$4, author_name=$5,"
                " content_type=$6, checksum=$7, active=true, updated_at=now() WHERE id=$1",
                document_id, source["title"], source["url"], source["author_slug"],
                source["author_name"], source["content_type"], checksum,
            )
            await database.execute("DELETE FROM knowledge_chunks WHERE document_id=$1", document_id)
            stats["updated"] += 1
        else:
            document_id = await database.fetchval(
                "INSERT INTO knowledge_documents (source_collection, source_id, title, url,"
                " author_slug, author_name, content_type, checksum) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)"
                " RETURNING id",
                source["collection"], source["id"], source["title"], source["url"],
                source["author_slug"], source["author_name"], source["content_type"], checksum,
            )
            stats["created"] += 1

        for index, chunk in enumerate(chunk_text(text, cfg.chunk_size, cfg.chunk_overlap)):
            embedding = await ollama.embed(chunk, cfg.embedding_model)
            await database.execute(
                "INSERT INTO knowledge_chunks (document_id, chunk_index, content, embedding)"
                " VALUES ($1,$2,$3,$4)",
                document_id, index, chunk, "[" + ",".join(f"{x:.7f}" for x in embedding) + "]",
            )
            stats["chunks"] += 1

    # Deactivate anything no longer published (kept for audit; excluded from search).
    rows = await database.fetch("SELECT id, source_collection, source_id FROM knowledge_documents WHERE active")
    for row in rows:
        if (row["source_collection"], row["source_id"]) not in seen:
            await database.execute("UPDATE knowledge_documents SET active=false WHERE id=$1", row["id"])
            stats["deactivated"] += 1

    log.info("ingest complete: %s", stats)
    return stats


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    parser = argparse.ArgumentParser()
    parser.add_argument("--full", action="store_true", help="drop and rebuild the whole index")
    args = parser.parse_args()

    async def _main() -> None:
        await db.migrate()
        print(await run(full=args.full))
        await db.close()

    asyncio.run(_main())
