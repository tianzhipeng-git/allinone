use tauri::AppHandle;

use super::storage;
use super::types::{GtdDocument, GtdGroup, GtdImportPreview, GtdTree};

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
pub async fn gtd_rename_group(
    app: AppHandle,
    group_id: i32,
    name: String,
) -> Result<GtdGroup, String> {
    let conn = storage::connect(&app)?;
    storage::rename_group(&conn, group_id, &name)
}

#[tauri::command]
#[specta::specta]
pub async fn gtd_move_group(
    app: AppHandle,
    group_id: i32,
    parent_id: Option<i32>,
) -> Result<GtdGroup, String> {
    let conn = storage::connect(&app)?;
    storage::move_group(&conn, group_id, parent_id)
}

#[tauri::command]
#[specta::specta]
pub async fn gtd_delete_group(app: AppHandle, group_id: i32) -> Result<(), String> {
    let conn = storage::connect(&app)?;
    storage::delete_group(&conn, group_id)
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
pub async fn gtd_rename_document(
    app: AppHandle,
    document_id: i32,
    title: String,
) -> Result<GtdDocument, String> {
    let conn = storage::connect(&app)?;
    storage::rename_document(&conn, document_id, &title)
}

#[tauri::command]
#[specta::specta]
pub async fn gtd_move_document(
    app: AppHandle,
    document_id: i32,
    group_id: i32,
) -> Result<GtdDocument, String> {
    let conn = storage::connect(&app)?;
    storage::move_document(&conn, document_id, group_id)
}

#[tauri::command]
#[specta::specta]
pub async fn gtd_delete_document(app: AppHandle, document_id: i32) -> Result<(), String> {
    let conn = storage::connect(&app)?;
    storage::delete_document(&conn, document_id)
}

#[tauri::command]
#[specta::specta]
pub async fn gtd_preview_import_path(path: String) -> Result<GtdImportPreview, String> {
    storage::preview_import_path(&path)
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
