use crate::{Event, Response, ResponseContent, ContentDelta, Usage, Role};
use std::collections::HashMap;

pub struct StreamingResponseBuilder {
    pub response: Response,
    content_blocks: HashMap<usize, ResponseContentBuilder>,
}

#[derive(Debug)]
struct ResponseContentBuilder {
    content_type: ContentType,
    text_content: String,
    thinking_content: String,
    tool_use_id: Option<String>,
    tool_use_name: Option<String>,
    tool_use_input_json: String,
}

#[derive(Debug, Clone)]
enum ContentType {
    Text,
    Thinking,
    RedactedThinking(String),
    ToolUse,
}

impl StreamingResponseBuilder {
    pub fn new() -> Self {
        Self {
            response: Response::new(),
            content_blocks: HashMap::new(),
        }
    }
    pub fn set_resp(&mut self, resp:Response) {
        self.response = resp;
    }

    pub fn process_event(&mut self, event: Event) {
        match event {
            Event::MessageStart { message } => {
                self.response.id = message.id;
                self.response.response_type = message.response_type;
                self.response.role = message.role;
                self.response.model = message.model;
                self.response.stop_reason = message.stop_reason;
                self.response.stop_sequence = message.stop_sequence;
                self.update_usage(message.usage);
            }
            Event::ContentBlockStart { index, content_block } => {
                let content_type = match &content_block {
                    ResponseContent::Text { .. } => ContentType::Text,
                    ResponseContent::Thinking { .. } => ContentType::Thinking,
                    ResponseContent::RedactedThinking { data } => ContentType::RedactedThinking(data.clone()),
                    ResponseContent::ToolUse { id, name, .. } => {
                        let mut builder = ResponseContentBuilder::new(ContentType::ToolUse);
                        builder.tool_use_id = Some(id.clone());
                        builder.tool_use_name = Some(name.clone());
                        self.content_blocks.insert(index, builder);
                        return;
                    }
                };

                let mut builder = ResponseContentBuilder::new(content_type);
                
                // Initialize with any starting content
                match content_block {
                    ResponseContent::Text { text } => builder.text_content = text,
                    ResponseContent::Thinking { thinking } => builder.thinking_content = thinking,
                    ResponseContent::RedactedThinking { .. } => {}, // data already stored in content_type
                    ResponseContent::ToolUse { .. } => {}, // handled above
                }

                self.content_blocks.insert(index, builder);
            }
            Event::ContentBlockDelta { index, delta } => {
                if let Some(builder) = self.content_blocks.get_mut(&index) {
                    match delta {
                        ContentDelta::TextDelta { text } => {
                            builder.text_content.push_str(&text);
                        }
                        ContentDelta::ThinkingDelta { thinking } => {
                            builder.thinking_content.push_str(&thinking);
                        }
                        ContentDelta::SignatureDelta { signature: _ } => {
                            // For now, we don't handle signatures in the final response
                            // This could be extended if needed
                        }
                        ContentDelta::InputJsonDelta { partial_json } => {
                            builder.tool_use_input_json.push_str(&partial_json);
                        }
                    }
                }
            }
            Event::ContentBlockStop { index } => {
                if let Some(builder) = self.content_blocks.remove(&index) {
                    let content = builder.build_response_content();
                    if let Some(content) = content {
                        self.response.content.push(content);
                    }
                }
            }
            Event::MessageDelta { delta, usage } => {
                if let Some(stop_reason) = delta.stop_reason {
                    self.response.stop_reason = Some(stop_reason);
                }
                if let Some(stop_sequence) = delta.stop_sequence {
                    self.response.stop_sequence = Some(stop_sequence);
                }
                self.update_usage(usage);
            }
            Event::MessageStop => {
                // Message is complete, nothing more to do
            }
            Event::Ping => {
                // Ignore ping events
            }
            Event::Error { error } => {
                eprintln!("Stream error: {:?}", error);
            }
        }
    }

    fn update_usage(&mut self, new_usage: Usage) {
        if let Some(input_tokens) = new_usage.input_tokens {
            self.response.usage.input_tokens = Some(input_tokens);
        }
        if let Some(output_tokens) = new_usage.output_tokens {
            self.response.usage.output_tokens = Some(output_tokens);
        }
        if let Some(cache_creation_input_tokens) = new_usage.cache_creation_input_tokens {
            self.response.usage.cache_creation_input_tokens = Some(cache_creation_input_tokens);
        }
        if let Some(cache_read_input_tokens) = new_usage.cache_read_input_tokens {
            self.response.usage.cache_read_input_tokens = Some(cache_read_input_tokens);
        }
    }

    pub fn finalize(self) -> Response {
        self.response
    }
}

impl ResponseContentBuilder {
    fn new(content_type: ContentType) -> Self {
        Self {
            content_type,
            text_content: String::new(),
            thinking_content: String::new(),
            tool_use_id: None,
            tool_use_name: None,
            tool_use_input_json: String::new(),
        }
    }

    fn build_response_content(self) -> Option<ResponseContent> {
        match self.content_type {
            ContentType::Text => {
                if !self.text_content.is_empty() {
                    Some(ResponseContent::Text {
                        text: self.text_content,
                    })
                } else {
                    None
                }
            }
            ContentType::Thinking => {
                if !self.thinking_content.is_empty() {
                    Some(ResponseContent::Thinking {
                        thinking: self.thinking_content,
                    })
                } else {
                    None
                }
            }
            ContentType::RedactedThinking(data) => {
                Some(ResponseContent::RedactedThinking { data })
            }
            ContentType::ToolUse => {
                if let (Some(id), Some(name)) = (self.tool_use_id, self.tool_use_name) {
                    let input = if self.tool_use_input_json.trim().is_empty() {
                        serde_json::Value::Object(serde_json::Map::new())
                    } else {
                        serde_json::from_str(&self.tool_use_input_json)
                            .unwrap_or_else(|_| serde_json::Value::Object(serde_json::Map::new()))
                    };

                    Some(ResponseContent::ToolUse { id, name, input })
                } else {
                    None
                }
            }
        }
    }
}