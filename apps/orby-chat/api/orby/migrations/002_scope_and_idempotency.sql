-- v1.1: knowledge scope (site | team | person) + client idempotency keys.
ALTER TABLE knowledge_documents ADD COLUMN scope text NOT NULL DEFAULT 'site';
UPDATE knowledge_documents SET scope = CASE
  WHEN source_collection = 'authors' THEN 'team'
  ELSE 'site'
END;
-- files get their scope at ingest time; author-specific docs are person-filterable
-- via the existing author_slug column regardless of scope.

ALTER TABLE chat_messages ADD COLUMN client_msg_id text;
-- one user message per client key per session: retries can never duplicate
CREATE UNIQUE INDEX idx_messages_client_key
  ON chat_messages(session_id, client_msg_id)
  WHERE client_msg_id IS NOT NULL AND role = 'user';
