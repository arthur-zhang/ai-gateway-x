-- Unify streaming and non-streaming responses under a single 'response' field
-- First, add the new response column
ALTER TABLE sessions ADD COLUMN response TEXT;

-- Copy data from non_streaming_response to response
UPDATE sessions SET response = non_streaming_response WHERE non_streaming_response IS NOT NULL;

-- Copy data from response_messages to response (if any sessions only have streaming data)
-- For now, we'll migrate existing response_messages to the response field
-- (This might not be needed if all sessions already use non_streaming_response format)
UPDATE sessions SET response = response_messages 
WHERE response IS NULL AND response_messages IS NOT NULL;

-- Drop the old columns
ALTER TABLE sessions DROP COLUMN non_streaming_response;
ALTER TABLE sessions DROP COLUMN response_messages;