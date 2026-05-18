use std::path::{Path, PathBuf};

use rusqlite::{params, Connection, OptionalExtension};
use tauri::{AppHandle, Manager};

use super::types::{GtdDocument, GtdGroup, GtdTree};

const DEFAULT_GROUP_NAME: &str = "Inbox";

pub fn connect(app: &AppHandle) -> Result<Connection, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {e}"))?;

    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {e}"))?;

    let conn = Connection::open(app_data_dir.join("allinone.sqlite"))
        .map_err(|e| format!("Failed to open SQLite database: {e}"))?;
    migrate(&conn)?;
    Ok(conn)
}

fn migrate(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS gtd_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parent_id INTEGER REFERENCES gtd_groups(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS gtd_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER NOT NULL REFERENCES gtd_groups(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            path TEXT NOT NULL UNIQUE,
            markdown_heading TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_gtd_groups_parent_sort
            ON gtd_groups(parent_id, sort_order, name);

        CREATE INDEX IF NOT EXISTS idx_gtd_documents_group_title
            ON gtd_documents(group_id, title);
        ",
    )
    .map_err(|e| format!("Failed to migrate GTD database: {e}"))?;

    ensure_default_group(conn)?;
    Ok(())
}

fn ensure_default_group(conn: &Connection) -> Result<(), String> {
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM gtd_groups", [], |row| row.get(0))
        .map_err(|e| format!("Failed to inspect GTD groups: {e}"))?;

    if count == 0 {
        conn.execute(
            "INSERT INTO gtd_groups (name, sort_order) VALUES (?1, 0)",
            [DEFAULT_GROUP_NAME],
        )
        .map_err(|e| format!("Failed to create default GTD group: {e}"))?;
    }

    Ok(())
}

pub fn get_tree(conn: &Connection) -> Result<GtdTree, String> {
    let mut group_stmt = conn
        .prepare(
            "
            SELECT id, parent_id, name, sort_order
            FROM gtd_groups
            ORDER BY parent_id IS NOT NULL, parent_id, sort_order, name
            ",
        )
        .map_err(|e| format!("Failed to prepare GTD group query: {e}"))?;

    let groups = group_stmt
        .query_map([], map_group)
        .map_err(|e| format!("Failed to query GTD groups: {e}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to read GTD groups: {e}"))?;

    let mut doc_stmt = conn
        .prepare(
            "
            SELECT id, group_id, title, path, markdown_heading, created_at, updated_at
            FROM gtd_documents
            ORDER BY title COLLATE NOCASE
            ",
        )
        .map_err(|e| format!("Failed to prepare GTD document query: {e}"))?;

    let documents = doc_stmt
        .query_map([], map_document)
        .map_err(|e| format!("Failed to query GTD documents: {e}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to read GTD documents: {e}"))?;

    Ok(GtdTree { groups, documents })
}

pub fn create_group(
    conn: &Connection,
    name: &str,
    parent_id: Option<i32>,
) -> Result<GtdGroup, String> {
    let trimmed = name.trim();
    validate_group_name(trimmed)?;

    if let Some(id) = parent_id {
        ensure_group_exists(conn, id)?;
    }

    let sort_order = next_group_sort_order(conn, parent_id)?;
    conn.execute(
        "INSERT INTO gtd_groups (parent_id, name, sort_order) VALUES (?1, ?2, ?3)",
        params![parent_id, trimmed, sort_order],
    )
    .map_err(|e| format!("Failed to create GTD group: {e}"))?;

    let group_id = i32::try_from(conn.last_insert_rowid())
        .map_err(|_| "Created GTD group id exceeded supported range".to_string())?;
    get_group(conn, group_id)
}

pub fn register_document(
    conn: &Connection,
    path: &str,
    group_id: i32,
    title: Option<String>,
) -> Result<GtdDocument, String> {
    ensure_group_exists(conn, group_id)?;

    let path_buf = validate_markdown_path(path)?;
    let content = std::fs::read_to_string(&path_buf)
        .map_err(|e| format!("Failed to read Markdown file: {e}"))?;
    let heading = extract_first_heading(&content);
    let title = title
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .or_else(|| heading.clone())
        .or_else(|| {
            path_buf
                .file_stem()
                .and_then(|value| value.to_str())
                .map(ToString::to_string)
        })
        .unwrap_or_else(|| "Untitled".to_string());
    validate_document_title(&title)?;

    let normalized_path = path_buf.to_string_lossy().to_string();

    conn.execute(
        "
        INSERT INTO gtd_documents (group_id, title, path, markdown_heading)
        VALUES (?1, ?2, ?3, ?4)
        ON CONFLICT(path) DO UPDATE SET
            group_id = excluded.group_id,
            title = excluded.title,
            markdown_heading = excluded.markdown_heading,
            updated_at = CURRENT_TIMESTAMP
        ",
        params![group_id, title, normalized_path, heading],
    )
    .map_err(|e| format!("Failed to register GTD document: {e}"))?;

    get_document_by_path(conn, path_buf.as_path())
}

pub fn read_document(conn: &Connection, document_id: i32) -> Result<String, String> {
    let document = get_document(conn, document_id)?;
    let path = validate_markdown_path(&document.path)?;
    std::fs::read_to_string(path).map_err(|e| format!("Failed to read Markdown file: {e}"))
}

pub fn save_document(conn: &Connection, document_id: i32, content: &str) -> Result<(), String> {
    let document = get_document(conn, document_id)?;
    let path = validate_markdown_path(&document.path)?;
    let temp_path = path.with_extension("tmp");

    std::fs::write(&temp_path, content)
        .map_err(|e| format!("Failed to write temporary Markdown file: {e}"))?;

    if let Err(rename_err) = std::fs::rename(&temp_path, &path) {
        if let Err(remove_err) = std::fs::remove_file(&temp_path) {
            log::warn!("Failed to remove GTD temp file after save failure: {remove_err}");
        }
        return Err(format!("Failed to save Markdown file: {rename_err}"));
    }

    let heading = extract_first_heading(content);
    conn.execute(
        "
        UPDATE gtd_documents
        SET markdown_heading = ?1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?2
        ",
        params![heading, document_id],
    )
    .map_err(|e| format!("Failed to update GTD document metadata: {e}"))?;

    Ok(())
}

fn next_group_sort_order(conn: &Connection, parent_id: Option<i32>) -> Result<i32, String> {
    conn.query_row(
        "
        SELECT COALESCE(MAX(sort_order), -1) + 1
        FROM gtd_groups
        WHERE parent_id IS ?1
        ",
        [parent_id],
        |row| row.get(0),
    )
    .map_err(|e| format!("Failed to determine GTD group order: {e}"))
}

fn get_group(conn: &Connection, id: i32) -> Result<GtdGroup, String> {
    conn.query_row(
        "SELECT id, parent_id, name, sort_order FROM gtd_groups WHERE id = ?1",
        [id],
        map_group,
    )
    .map_err(|e| format!("Failed to load GTD group: {e}"))
}

fn ensure_group_exists(conn: &Connection, id: i32) -> Result<(), String> {
    let exists = conn
        .query_row("SELECT 1 FROM gtd_groups WHERE id = ?1", [id], |_| Ok(()))
        .optional()
        .map_err(|e| format!("Failed to inspect GTD group: {e}"))?;

    exists.ok_or_else(|| format!("GTD group not found: {id}"))
}

fn get_document(conn: &Connection, id: i32) -> Result<GtdDocument, String> {
    conn.query_row(
        "
        SELECT id, group_id, title, path, markdown_heading, created_at, updated_at
        FROM gtd_documents
        WHERE id = ?1
        ",
        [id],
        map_document,
    )
    .map_err(|e| format!("Failed to load GTD document: {e}"))
}

fn get_document_by_path(conn: &Connection, path: &Path) -> Result<GtdDocument, String> {
    let normalized_path = path.to_string_lossy().to_string();
    conn.query_row(
        "
        SELECT id, group_id, title, path, markdown_heading, created_at, updated_at
        FROM gtd_documents
        WHERE path = ?1
        ",
        [normalized_path],
        map_document,
    )
    .map_err(|e| format!("Failed to load registered GTD document: {e}"))
}

fn validate_group_name(name: &str) -> Result<(), String> {
    if name.is_empty() {
        return Err("Group name cannot be empty".to_string());
    }

    if name.chars().count() > 80 {
        return Err("Group name too long (max 80 characters)".to_string());
    }

    Ok(())
}

fn validate_document_title(title: &str) -> Result<(), String> {
    if title.chars().count() > 160 {
        return Err("Document title too long (max 160 characters)".to_string());
    }

    Ok(())
}

fn validate_markdown_path(path: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(path);
    let canonical = path
        .canonicalize()
        .map_err(|e| format!("Failed to resolve Markdown path: {e}"))?;

    if !canonical.is_file() {
        return Err("Markdown path must point to a file".to_string());
    }

    let extension = canonical
        .extension()
        .and_then(|value| value.to_str())
        .map(str::to_ascii_lowercase);

    match extension.as_deref() {
        Some("md") | Some("markdown") => Ok(canonical),
        _ => Err("Only .md and .markdown files can be registered".to_string()),
    }
}

pub fn extract_first_heading(content: &str) -> Option<String> {
    content.lines().find_map(|line| {
        let trimmed = line.trim_start();
        if !trimmed.starts_with('#') {
            return None;
        }

        let hashes = trimmed.chars().take_while(|value| *value == '#').count();
        if !(1..=6).contains(&hashes) {
            return None;
        }

        let rest = trimmed[hashes..].trim();
        if rest.is_empty() {
            None
        } else {
            Some(rest.trim_matches('#').trim().to_string())
        }
    })
}

fn map_group(row: &rusqlite::Row<'_>) -> rusqlite::Result<GtdGroup> {
    Ok(GtdGroup {
        id: row.get(0)?,
        parent_id: row.get(1)?,
        name: row.get(2)?,
        sort_order: row.get(3)?,
    })
}

fn map_document(row: &rusqlite::Row<'_>) -> rusqlite::Result<GtdDocument> {
    Ok(GtdDocument {
        id: row.get(0)?,
        group_id: row.get(1)?,
        title: row.get(2)?,
        path: row.get(3)?,
        markdown_heading: row.get(4)?,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
    })
}

#[cfg(test)]
mod tests {
    use super::extract_first_heading;

    #[test]
    fn extracts_first_markdown_heading() {
        let content = "\nbody\n## Project Tasks\n- item";

        assert_eq!(
            extract_first_heading(content),
            Some("Project Tasks".to_string())
        );
    }

    #[test]
    fn ignores_empty_heading_markers() {
        let content = "###\n# Real Heading";

        assert_eq!(
            extract_first_heading(content),
            Some("Real Heading".to_string())
        );
    }
}
