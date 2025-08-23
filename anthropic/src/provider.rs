use std::sync::Arc;

use crate::{AnthropicError, AnthropicResult, ChatResponseStream, Event, Response};
use crate::{Request as AnthropicRequest, RespEvent};
use bytes::Bytes;
use either::Either;
use futures::StreamExt;
use futures::io::BufReader;
use futures::{AsyncBufReadExt, TryStreamExt};
use llm_common::LanguageModelCompletionEvent;
use tokio::sync::mpsc::{self, Sender, UnboundedSender};

pub struct AnthropicProvider {
    client: reqwest::Client,
    base_url: String,
}

impl AnthropicProvider {
    pub fn new(base_url: &str) -> Self {
        Self {
            client: reqwest::Client::new(),
            base_url: base_url.to_string(),
        }
    }

    pub async fn execute(
        &self,
        mut headers: http::HeaderMap,
        // req_body: Arc<AnthropicRequest>,
        req_body: String,
        is_streaming: bool,
        tx: Sender<Result<RespEvent, AnthropicError>>,
    ) -> AnthropicResult<http::Response<Either<ChatResponseStream, Bytes>>> {
        let url = format!("{}/v1/messages", self.base_url);
        println!("--------------------------------");
        println!("base_url: {}", self.base_url);
        println!("url: {}", url);
        println!("headers: {:?}", headers);
        println!("--------------------------------");

        headers.remove("content-length");
        headers.remove("host");

        let upstream_response = self
            .client
            .post(url)
            .headers(headers)
            .body(req_body)
            .send()
            .await
            .map_err(|e| AnthropicError::HttpSend(e.into()))?;

        let mut downstream_response = http::Response::builder();

        let headers = upstream_response.headers().clone();
        let status_code = upstream_response.status();

        if let Err(e) = tx
            .send(Ok(RespEvent::RespHeaders(headers.clone(), status_code)))
            .await
        {
            eprintln!("Failed to send response headers: {:?}", e);
        }

        downstream_response = downstream_response.status(status_code);
        downstream_response
            .headers_mut()
            .map(|map| map.extend(headers));

        if status_code.is_success() {
            if is_streaming {
                let stream = upstream_response
                    .bytes_stream()
                    .map_err(|e| futures::io::Error::new(futures::io::ErrorKind::Other, e))
                    .into_async_read();
                let br = BufReader::new(stream);
                let stream = br.lines().filter_map(move |line| {
                    let tx = tx.clone();
                    async move {
                        match line {
                            Ok(line) => {
                                println!("!!!!!streaming line: {}", line);
                                if let Some(striped_line) = line.strip_prefix("data: ")
                                    && let Ok(event) = serde_json::from_str::<Event>(striped_line)
                                {
                                    if let Err(e) = tx.send(Ok(RespEvent::Streaming(event))).await {
                                        eprintln!("Failed to send streaming event: {:?}", e);
                                    }
                                }

                                Some(Ok(line))
                            }
                            Err(error) => Some(Err(AnthropicError::ReadResponse(error))),
                        }
                    }
                });

                let resp = downstream_response
                    .body(Either::Left(stream.boxed()))
                    .map_err(|e| AnthropicError::HttpSend(e.into()))?;
                Ok(resp)
            } else {
                println!("send non streaming");
                // let resp = serde_json::from_str::<Response>(&response.text().await.unwrap()).unwrap();
                let resp = upstream_response
                    .bytes()
                    .await
                    .map_err(|e| AnthropicError::HttpSend(e.into()))?;
                // let resp = upstream_response
                //     .json::<Response>()
                //     .await
                //     .map_err(|e| AnthropicError::HttpSend(e.into()))?;
                let parsed_resp = serde_json::from_slice::<Response>(&resp)
                    .map_err(|e| AnthropicError::HttpSend(e.into()))?;
                if let Err(e) = tx
                    .send(Ok(RespEvent::NonStreaming(parsed_resp.clone())))
                    .await
                {
                    eprintln!("Failed to send non-streaming response: {:?}", e);
                }
                let resp = downstream_response
                    .body(Either::Right(resp))
                    .map_err(|e| AnthropicError::HttpSend(e.into()))?;
                Ok(resp)
            }
        } else {
            let body = upstream_response
                .bytes()
                .await
                .map_err(|e| AnthropicError::HttpSend(e.into()))?;
            let resp = downstream_response
                .body(Either::Right(body))
                .map_err(|e| AnthropicError::HttpSend(e.into()))?;
            Ok(resp)
        }
    }
}
