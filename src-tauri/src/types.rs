//! Shared types and validation functions for the Tauri application.

use regex::Regex;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::sync::LazyLock;

/// Default shortcut for the quick pane
pub const DEFAULT_QUICK_PANE_SHORTCUT: &str = "CommandOrControl+Shift+.";

/// Maximum size for recovery data files (10MB)
pub const MAX_RECOVERY_DATA_BYTES: u32 = 10_485_760;

/// Pre-compiled regex pattern for filename validation.
/// Only allows alphanumeric characters, dashes, underscores, and a single extension.
pub static FILENAME_PATTERN: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9]+)?$")
        .expect("Failed to compile filename regex pattern")
});

// ============================================================================
// Preferences
// ============================================================================

fn default_bool_true() -> bool {
    true
}

fn default_sidebar_width_pct() -> f64 {
    20.0
}

/// Application preferences that persist to disk.
/// Only contains settings that should be saved between sessions.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AppPreferences {
    pub theme: String,
    /// Global shortcut for quick pane (e.g., "CommandOrControl+Shift+.")
    /// If None, uses the default shortcut
    pub quick_pane_shortcut: Option<String>,
    /// User's preferred language (e.g., "en", "es", "de")
    /// If None, uses system locale detection
    pub language: Option<String>,
    #[serde(default = "default_bool_true")]
    pub left_sidebar_visible: bool,
    #[serde(default = "default_bool_true")]
    pub right_sidebar_visible: bool,
    /// Preferred width as a percentage (main window horizontal split).
    #[serde(default = "default_sidebar_width_pct")]
    pub left_sidebar_size: f64,
    #[serde(default = "default_sidebar_width_pct")]
    pub right_sidebar_size: f64,
}

impl AppPreferences {
    /// Clamp sidebar widths so each stays in [15, 40] and main content keeps at least 30%.
    /// Matches frontend `MainWindow` `ResizablePanel` min/max.
    pub fn normalize_sidebar_layout(&mut self) {
        self.left_sidebar_size = self.left_sidebar_size.clamp(15.0, 40.0);
        self.right_sidebar_size = self.right_sidebar_size.clamp(15.0, 40.0);
        let mut main = 100.0 - self.left_sidebar_size - self.right_sidebar_size;
        let mut iterations = 0;
        while main < 30.0 && iterations < 8 {
            let deficit = (30.0 - main) / 2.0;
            self.left_sidebar_size -= deficit;
            self.right_sidebar_size -= deficit;
            self.left_sidebar_size = self.left_sidebar_size.clamp(15.0, 40.0);
            self.right_sidebar_size = self.right_sidebar_size.clamp(15.0, 40.0);
            main = 100.0 - self.left_sidebar_size - self.right_sidebar_size;
            iterations += 1;
        }
        if main < 30.0 {
            self.left_sidebar_size = default_sidebar_width_pct();
            self.right_sidebar_size = default_sidebar_width_pct();
        }
    }
}

impl Default for AppPreferences {
    fn default() -> Self {
        Self {
            theme: "system".to_string(),
            quick_pane_shortcut: None, // None means use default
            language: None,            // None means use system locale
            left_sidebar_visible: true,
            right_sidebar_visible: true,
            left_sidebar_size: default_sidebar_width_pct(),
            right_sidebar_size: default_sidebar_width_pct(),
        }
    }
}

// ============================================================================
// Recovery Errors
// ============================================================================

/// Error types for recovery operations (typed for frontend matching)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type")]
pub enum RecoveryError {
    /// File does not exist (expected case, not a failure)
    FileNotFound,
    /// Filename validation failed
    ValidationError { message: String },
    /// Data exceeds size limit
    DataTooLarge { max_bytes: u32 },
    /// File system read/write error
    IoError { message: String },
    /// JSON serialization/deserialization error
    ParseError { message: String },
}

impl std::fmt::Display for RecoveryError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RecoveryError::FileNotFound => write!(f, "File not found"),
            RecoveryError::ValidationError { message } => write!(f, "Validation error: {message}"),
            RecoveryError::DataTooLarge { max_bytes } => {
                write!(f, "Data too large (max {max_bytes} bytes)")
            }
            RecoveryError::IoError { message } => write!(f, "IO error: {message}"),
            RecoveryError::ParseError { message } => write!(f, "Parse error: {message}"),
        }
    }
}

// ============================================================================
// Validation Functions
// ============================================================================

/// Validates a filename for safe file system operations.
/// Only allows alphanumeric characters, dashes, underscores, and a single extension.
pub fn validate_filename(filename: &str) -> Result<(), String> {
    if filename.is_empty() {
        return Err("Filename cannot be empty".to_string());
    }

    if filename.chars().count() > 100 {
        return Err("Filename too long (max 100 characters)".to_string());
    }

    if !FILENAME_PATTERN.is_match(filename) {
        return Err(
            "Invalid filename: only alphanumeric characters, dashes, underscores, and dots allowed"
                .to_string(),
        );
    }

    Ok(())
}

/// Validates string input length (by character count, not bytes).
pub fn validate_string_input(input: &str, max_len: usize, field_name: &str) -> Result<(), String> {
    let char_count = input.chars().count();
    if char_count > max_len {
        return Err(format!("{field_name} too long (max {max_len} characters)"));
    }
    Ok(())
}

/// Validates theme value.
pub fn validate_theme(theme: &str) -> Result<(), String> {
    match theme {
        "light" | "dark" | "system" => Ok(()),
        _ => Err("Invalid theme: must be 'light', 'dark', or 'system'".to_string()),
    }
}
