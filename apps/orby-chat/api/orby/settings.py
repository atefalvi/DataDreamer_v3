"""Environment settings — secrets and infrastructure only.

Everything operational (prompts, models, limits, toggles) lives in the Directus
`orby` collection so the owner can change it without redeploying. Env holds what
must never be in a CMS: credentials, network addresses, and the embedding dimension
(which is baked into the pgvector column and must not drift silently).
"""
from __future__ import annotations

import os
from dataclasses import dataclass


def _int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    database_url: str = os.environ.get(
        "ORBY_DATABASE_URL", "postgresql://orby:orby@localhost:5433/orby"
    )
    directus_url: str = os.environ.get("ORBY_DIRECTUS_URL", "https://api.data-dreamer.net")
    directus_token: str = os.environ.get("ORBY_DIRECTUS_TOKEN", "")

    ollama_url: str = os.environ.get("ORBY_OLLAMA_URL", "http://192.168.1.27:11435")
    ollama_fallback_url: str = os.environ.get("ORBY_OLLAMA_FALLBACK_URL", "")
    # Must match the vector(N) column created by the migration. Changing it requires
    # a re-embed + new migration; the ingest command validates it against the live
    # embedding model and refuses to run on mismatch.
    embedding_dim: int = _int("ORBY_EMBEDDING_DIM", 768)

    discord_webhook_url: str = os.environ.get("ORBY_DISCORD_WEBHOOK_URL", "")

    # Pepper for hashing visitor tokens / IPs before storage (privacy: raw values
    # never persist). Rotating it orphans anonymous visitors — acceptable.
    hash_pepper: str = os.environ.get("ORBY_HASH_PEPPER", "dev-only-pepper")

    public_origin: str = os.environ.get("ORBY_PUBLIC_ORIGIN", "http://localhost:8100")
    environment: str = os.environ.get("ORBY_ENV", "development")

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


settings = Settings()
