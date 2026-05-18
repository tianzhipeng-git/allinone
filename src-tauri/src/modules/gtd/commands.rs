use tauri::AppHandle;

use super::storage;
use super::types::{GtdDocument, GtdGroup, GtdTree};

#[tauri::command]
#[specta::specta]
pub async fn gtd_get_tree(app: AppHandle) -> Result<GtdTree, String> {
    let conn = storage::connect(&app)?;
    storage::get_tree(&conn)
}

#[tauri::command]
#[specta::specta]
pub async fn gtd_create_group(
    app: AppHandle,
    name: String,
    parent_id: Option<i32>,
) -> Result<GtdGroup, String> {
    let conn = storage::connect(&app)?;
    storage::create_group(&conn, &name, parent_id)
}

#[tauri::command]
#[specta::specta]
pub async fn gtd_register_document(
    app: AppHandle,
    path: String,
    group_id: i32,
    title: Option<String>,
) -> Result<GtdDocument, String> {
    let conn = storage::connect(&app)?;
    storage::register_document(&conn, &path, group_id, title)
}

#[tauri::command]
#[specta::specta]
pub async fn gtd_read_document(app: AppHandle, document_id: i32) -> Result<String, String> {
    let conn = storage::connect(&app)?;
    storage::read_document(&conn, document_id)
}

#[tauri::command]
#[specta::specta]
pub async fn gtd_save_document(
    app: AppHandle,
    document_id: i32,
    content: String,
) -> Result<(), String> {
    let conn = storage::connect(&app)?;
    storage::save_document(&conn, document_id, &content)
}
