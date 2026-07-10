"""Guardrails — pure functions, no I/O, fully unit-tested.

Layers (brief §7): message budget checks, prompt-injection detection, and a
rule-based scope classifier. The model never sees a message these reject, and
factual answers additionally require retrieval evidence (enforced in chat.py).
"""
from __future__ import annotations

import re
from dataclasses import dataclass

INJECTION_PATTERNS = [
    r"ignore\s+(all\s+|any\s+)?(previous|prior|above|earlier)\s+(instructions|prompts|rules)",
    r"disregard\s+(your|the|all)\s+.{0,20}(instructions|rules|guidelines)",
    r"(reveal|show|print|repeat|output)\s+.{0,30}(system\s*prompt|instructions|configuration|config|rules)",
    r"you\s+are\s+(now|no\s+longer)\s+",
    r"act\s+as\s+(?!.*data\s*dreamer)",
    r"jailbreak|dan\s+mode|developer\s+mode",
    r"(api|secret|service)\s*(key|token)s?\b",
    r"unpublished|draft\s+(post|content|article)s?\b.{0,20}(show|list|reveal|access)",
    r"<\s*(script|iframe)",
]
_INJECTION = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]

GREETING = re.compile(
    r"^\s*(hi|hii+|hello|hey|yo|hiya|good\s+(morning|afternoon|evening)|salaam|salam|assalamu\s*alaikum|howdy|sup|what'?s\s+up)[\s!,.?]*$",
    re.IGNORECASE,
)

HANDOFF = re.compile(
    r"(speak|talk|meet|call|chat)\s+(to|with)\s+(a\s+human|someone|syed|the\s+owner|the\s+team)"
    r"|book\s+(a\s+)?(call|meeting|time|conversation)"
    r"|schedule\s+(a\s+)?(call|meeting|interview)"
    r"|contact\s+(you|syed|the\s+owner)"
    r"|hire|hiring|consulting|freelance|collaborat",
    re.IGNORECASE,
)

# Obvious out-of-scope asks that shouldn't waste a retrieval round-trip. Kept short —
# the retrieval-evidence requirement is the real gate; this just fast-paths clarity.
OFF_TOPIC = re.compile(
    r"^(write|generate|create)\s+(me\s+)?(a\s+)?(poem|song|essay|story|code|script)\b"
    r"|weather|stock\s+price|bitcoin|recipe|horoscope|lottery"
    r"|(who|what)\s+is\s+the\s+(president|prime\s+minister|capital\s+of)",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class Classification:
    kind: str  # greeting | handoff | injection | off_topic | too_long | datadreamer
    detail: str = ""


def classify(message: str, max_length: int) -> Classification:
    text = message.strip()
    if len(text) > max_length:
        return Classification("too_long", f"{len(text)} chars")
    for pattern in _INJECTION:
        match = pattern.search(text)
        if match:
            return Classification("injection", match.group(0)[:80])
    if GREETING.match(text):
        return Classification("greeting")
    if HANDOFF.search(text):
        return Classification("handoff")
    if OFF_TOPIC.search(text):
        return Classification("off_topic")
    return Classification("datadreamer")


def detect_person(message: str, known_authors: dict[str, str]) -> str | None:
    """Return an author slug when the query clearly names a known contributor.

    known_authors: lowercase name (and name parts) → slug, built from ingested
    documents so it always matches what retrieval can actually filter on.
    """
    lowered = f" {message.lower()} "
    best: str | None = None
    best_len = 0
    for name, slug in known_authors.items():
        if len(name) >= 4 and f" {name} " in lowered.replace("'s ", " ").replace("?", " ").replace(".", " ").replace(",", " "):
            if len(name) > best_len:
                best, best_len = slug, len(name)
    return best


def chunk_text(text: str, size: int, overlap: int) -> list[str]:
    """Paragraph-aware chunking: pack paragraphs up to `size` chars, carrying
    `overlap` tail characters into the next chunk for continuity."""
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]
    chunks: list[str] = []
    current = ""
    for para in paragraphs:
        while len(para) > size:  # oversized paragraph: hard split on sentence-ish bounds
            cut = para.rfind(". ", 0, size)
            cut = cut + 1 if cut > size // 2 else size
            piece, para = para[:cut].strip(), para[cut:].strip()
            if current:
                chunks.append(current)
                current = ""
            chunks.append(piece)
        if len(current) + len(para) + 2 <= size:
            current = f"{current}\n\n{para}".strip()
        else:
            if current:
                chunks.append(current)
            current = (chunks[-1][-overlap:] + "\n\n" if chunks and overlap else "") + para
    if current:
        chunks.append(current)
    return [c for c in chunks if len(c) > 40]  # drop fragments too small to embed usefully


def strip_markup(markdown: str) -> str:
    """Markdown/HTML → plain-ish text for embedding. Cheap and adequate."""
    text = re.sub(r"```[\s\S]*?```", " ", markdown)          # code fences
    text = re.sub(r"^:::.*$", " ", text, flags=re.MULTILINE)  # custom blocks markers
    text = re.sub(r"<[^>]+>", " ", text)                      # html tags
    text = re.sub(r"!\[([^\]]*)\]\([^)]*\)", r"\1", text)     # images → alt
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)      # links → text
    text = re.sub(r"[#*_`>|]+", " ", text)                    # md decorations
    return re.sub(r"[ \t]+", " ", text).strip()
