-- Add tool_use column to sessions table for storing tool calls
ALTER TABLE sessions ADD COLUMN tool_use_json TEXT;