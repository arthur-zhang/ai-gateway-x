-- Add non_streaming_response column to sessions table for storing non-streaming responses
ALTER TABLE sessions ADD COLUMN non_streaming_response TEXT;