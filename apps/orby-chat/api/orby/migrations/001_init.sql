-- Orby chat schema v1. Isolated database; UUID keys; hashed identifiers only
-- (no raw visitor tokens or IPs at rest). {{EMBEDDING_DIM}} is fixed by env.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE chat_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_token_hash text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid NOT NULL REFERENCES chat_visitors(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  client_ip_hash text,
  user_agent text,
  referrer text,
  message_count int NOT NULL DEFAULT 0
);
CREATE INDEX idx_sessions_visitor ON chat_sessions(visitor_id);

CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  classification text,
  model text,
  latency_ms int,
  sources jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_session ON chat_messages(session_id, created_at);

CREATE TABLE knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_collection text NOT NULL,
  source_id text NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  author_slug text,
  author_name text,
  content_type text NOT NULL,
  published_at timestamptz,
  checksum text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_collection, source_id)
);

CREATE TABLE knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  heading text,
  content text NOT NULL,
  embedding vector({{EMBEDDING_DIM}}) NOT NULL
);
CREATE INDEX idx_chunks_document ON knowledge_chunks(document_id);
-- cosine index; fine for tens of thousands of chunks on a homelab
CREATE INDEX idx_chunks_embedding ON knowledge_chunks
  USING hnsw (embedding vector_cosine_ops);

CREATE TABLE safety_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  summary text NOT NULL,
  dedup_key text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
CREATE INDEX idx_notifications_dedup ON notification_events(dedup_key, created_at);
