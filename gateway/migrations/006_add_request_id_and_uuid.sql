-- Add request_id column and ensure id is UUID
-- First, add the request_id column
ALTER TABLE sessions ADD COLUMN request_id TEXT;

-- Update existing records to use the current id as request_id and generate new UUIDs for id
-- Note: In SQLite, we need to be careful about the UUID generation
-- For now, we'll copy the existing id to request_id and keep the same id structure
UPDATE sessions SET request_id = id WHERE request_id IS NULL;

-- Create index on request_id for fast lookups
CREATE INDEX idx_sessions_request_id ON sessions(request_id);