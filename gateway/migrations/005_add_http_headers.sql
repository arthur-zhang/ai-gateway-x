-- Add HTTP request and response headers columns
ALTER TABLE sessions ADD COLUMN http_req_headers TEXT; -- JSON object of request headers
ALTER TABLE sessions ADD COLUMN http_resp_headers TEXT; -- JSON object of response headers