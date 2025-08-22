// use futures::StreamExt;
// use tokio_stream::wrappers::ReceiverStream;
// use std::collections::HashMap;
// use std::pin::Pin;
// use std::str::FromStr;
// use futures_core::Stream;
// use llm_common::{LanguageModelCompletionError, LanguageModelCompletionEvent, LanguageModelToolUse, StopReason, TokenUsage};
// use crate::{AnthropicError, ContentDelta, Event, RespEvent, ResponseContent, Usage};

// pub struct AnthropicEventMapper {
//     tool_uses_by_index: HashMap<usize, RawToolUse>,
//     usage: Usage,
//     stop_reason: StopReason,
// }

// impl AnthropicEventMapper {
//     pub fn new() -> Self {
//         Self {
//             tool_uses_by_index: HashMap::default(),
//             usage: Usage::default(),
//             stop_reason: StopReason::EndTurn,
//         }
//     }
//     pub fn map_rx_stream(
//         mut self,
//         events: ReceiverStream<Result<RespEvent, AnthropicError>>,
//     ) -> impl Stream<Item = Result<LanguageModelCompletionEvent, LanguageModelCompletionError>>
//     {
//         events.filter_map(move |event| async move {
//             match event {
//                 Ok(RespEvent::Streaming(event)) => Some(Ok::<_, AnthropicError>(event)),
//                 Ok(RespEvent::NonStreaming(_)) => None,
//                 Err(error) => Some(Err(error.into())),
//             }
//         }).flat_map(move |event| {
//             futures::stream::iter(match event {
//                 Ok(event) => self.map_event(event),
//                 Err(error) => vec![Err(error.into())],
//             })
//         })
//     }
//     pub fn map_stream(
//         mut self,
//         events: Pin<Box<dyn Send + Stream<Item = Result<Event, AnthropicError>>>>,
//     ) -> impl Stream<Item = Result<LanguageModelCompletionEvent, LanguageModelCompletionError>>
//     {
//         events.flat_map(move |event| {
//             futures::stream::iter(match event {
//                 Ok(event) => self.map_event(event),
//                 Err(error) => vec![Err(error.into())],
//             })
//         })
//     }

//     pub fn map_event(
//         &mut self,
//         event: Event,
//     ) -> Vec<Result<LanguageModelCompletionEvent, LanguageModelCompletionError>> {
//         match event {
//             Event::ContentBlockStart {
//                 index,
//                 content_block,
//             } => match content_block {
//                 ResponseContent::Text { text } => {
//                     vec![Ok(LanguageModelCompletionEvent::Text(text))]
//                 }
//                 ResponseContent::Thinking { thinking } => {
//                     vec![Ok(LanguageModelCompletionEvent::Thinking {
//                         text: thinking,
//                         signature: None,
//                     })]
//                 }
//                 ResponseContent::RedactedThinking { data } => {
//                     vec![Ok(LanguageModelCompletionEvent::RedactedThinking { data })]
//                 }
//                 ResponseContent::ToolUse { id, name, .. } => {
//                     self.tool_uses_by_index.insert(
//                         index,
//                         RawToolUse {
//                             id,
//                             name,
//                             input_json: String::new(),
//                         },
//                     );
//                     Vec::new()
//                 }
//             },
//             Event::ContentBlockDelta { index, delta } => match delta {
//                 ContentDelta::TextDelta { text } => {
//                     vec![Ok(LanguageModelCompletionEvent::Text(text))]
//                 }
//                 ContentDelta::ThinkingDelta { thinking } => {
//                     vec![Ok(LanguageModelCompletionEvent::Thinking {
//                         text: thinking,
//                         signature: None,
//                     })]
//                 }
//                 ContentDelta::SignatureDelta { signature } => {
//                     vec![Ok(LanguageModelCompletionEvent::Thinking {
//                         text: "".to_string(),
//                         signature: Some(signature),
//                     })]
//                 }
//                 ContentDelta::InputJsonDelta { partial_json } => {
//                     if let Some(tool_use) = self.tool_uses_by_index.get_mut(&index) {
//                         tool_use.input_json.push_str(&partial_json);

//                         // Try to convert invalid (incomplete) JSON into
//                         // valid JSON that serde can accept, e.g. by closing
//                         // unclosed delimiters. This way, we can update the
//                         // UI with whatever has been streamed back so far.
//                         if let Ok(input) = serde_json::Value::from_str(
//                             &partial_json_fixer::fix_json(&tool_use.input_json),
//                         ) {
//                             return vec![Ok(LanguageModelCompletionEvent::ToolUse(
//                                 LanguageModelToolUse {
//                                     id: tool_use.id.clone().into(),
//                                     name: tool_use.name.clone().into(),
//                                     is_input_complete: false,
//                                     raw_input: tool_use.input_json.clone(),
//                                     input,
//                                 },
//                             ))];
//                         }
//                     }
//                     return vec![];
//                 }
//             },
//             Event::ContentBlockStop { index } => {
//                 if let Some(tool_use) = self.tool_uses_by_index.remove(&index) {
//                     let input_json = tool_use.input_json.trim();
//                     let input_value = if input_json.is_empty() {
//                         Ok(serde_json::Value::Object(serde_json::Map::default()))
//                     } else {
//                         serde_json::Value::from_str(input_json)
//                     };
//                     let event_result = match input_value {
//                         Ok(input) => Ok(LanguageModelCompletionEvent::ToolUse(
//                             LanguageModelToolUse {
//                                 id: tool_use.id.into(),
//                                 name: tool_use.name.into(),
//                                 is_input_complete: true,
//                                 input,
//                                 raw_input: tool_use.input_json.clone(),
//                             },
//                         )),
//                         Err(json_parse_err) => {
//                             Ok(LanguageModelCompletionEvent::ToolUseJsonParseError {
//                                 id: tool_use.id.into(),
//                                 tool_name: tool_use.name.into(),
//                                 raw_input: input_json.into(),
//                                 json_parse_error: json_parse_err.to_string(),
//                             })
//                         }
//                     };

//                     vec![event_result]
//                 } else {
//                     Vec::new()
//                 }
//             }
//             Event::MessageStart { message } => {
//                 update_usage(&mut self.usage, &message.usage);
//                 vec![
//                     Ok(LanguageModelCompletionEvent::UsageUpdate(convert_usage(
//                         &self.usage,
//                     ))),
//                     Ok(LanguageModelCompletionEvent::StartMessage {
//                         message_id: message.id,
//                     }),
//                 ]
//             }
//             Event::MessageDelta { delta, usage } => {
//                 update_usage(&mut self.usage, &usage);
//                 if let Some(stop_reason) = delta.stop_reason.as_deref() {
//                     self.stop_reason = match stop_reason {
//                         "end_turn" => StopReason::EndTurn,
//                         "max_tokens" => StopReason::MaxTokens,
//                         "tool_use" => StopReason::ToolUse,
//                         "refusal" => StopReason::Refusal,
//                         _ => {
//                             log::error!("Unexpected anthropic stop_reason: {stop_reason}");
//                             StopReason::EndTurn
//                         }
//                     };
//                 }
//                 vec![Ok(LanguageModelCompletionEvent::UsageUpdate(
//                     convert_usage(&self.usage),
//                 ))]
//             }
//             Event::MessageStop => {
//                 vec![Ok(LanguageModelCompletionEvent::Stop(self.stop_reason))]
//             }
//             Event::Error { error } => {
//                 vec![Err(error.into())]
//             }
//             _ => Vec::new(),
//         }
//     }
// }
// struct RawToolUse {
//     id: String,
//     name: String,
//     input_json: String,
// }

// fn update_usage(usage: &mut Usage, new: &Usage) {
//     if let Some(input_tokens) = new.input_tokens {
//         usage.input_tokens = Some(input_tokens);
//     }
//     if let Some(output_tokens) = new.output_tokens {
//         usage.output_tokens = Some(output_tokens);
//     }
//     if let Some(cache_creation_input_tokens) = new.cache_creation_input_tokens {
//         usage.cache_creation_input_tokens = Some(cache_creation_input_tokens);
//     }
//     if let Some(cache_read_input_tokens) = new.cache_read_input_tokens {
//         usage.cache_read_input_tokens = Some(cache_read_input_tokens);
//     }
// }
// fn convert_usage(usage: &Usage) -> TokenUsage {
//     TokenUsage {
//         input_tokens: usage.input_tokens.unwrap_or(0),
//         output_tokens: usage.output_tokens.unwrap_or(0),
//         cache_creation_input_tokens: usage.cache_creation_input_tokens.unwrap_or(0),
//         cache_read_input_tokens: usage.cache_read_input_tokens.unwrap_or(0),
//     }
// }