use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GtdGroup {
    pub id: i32,
    pub parent_id: Option<i32>,
    pub name: String,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GtdDocument {
    pub id: i32,
    pub group_id: i32,
    pub title: String,
    pub path: String,
    pub markdown_heading: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GtdTree {
    pub groups: Vec<GtdGroup>,
    pub documents: Vec<GtdDocument>,
}
