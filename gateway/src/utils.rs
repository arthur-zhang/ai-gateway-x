use std::collections::HashMap;

pub fn convert_headers(headers: &http::HeaderMap) -> HashMap<String, String> {
    let mut result = HashMap::new();
    for (name, value) in headers.iter() {
        result.insert(name.to_string(), value.to_str().unwrap_or("").to_string());
    }
    result
}

pub trait HeaderMapExt {
    fn to_string_map(&self) -> HashMap<String, String>;
}
impl HeaderMapExt for http::HeaderMap {
    fn to_string_map(&self) -> HashMap<String, String> {
        let mut result = HashMap::new();
        for (name, value) in self.iter() {
            result.insert(name.to_string(), value.to_str().unwrap_or("").to_string());
        }
        result
    }
}