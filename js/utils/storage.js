'use strict';

/**
 * =============================================================================
 * STORAGE MODULE
 * =============================================================================
 * Handles all localStorage operations for persisting user preferences
 * and document content across browser sessions.
 * =============================================================================
 */

const STORAGE_KEYS = {
    MARKDOWN_TEXT: 'markdownText',
    VIEW_MODE: 'viewMode',
    THEME: 'editorTheme',
    FONT: 'previewFont',
    SYNC_SCROLL: 'syncScroll'
};

/**
 * Saves markdown text to localStorage.
 *
 * @param {string} text - The markdown text to save
 */
export function saveMarkdownText(text) {
    localStorage.setItem(STORAGE_KEYS.MARKDOWN_TEXT, text);
}

/**
 * Loads markdown text from localStorage.
 *
 * @returns {string|null} The saved markdown text, or null if not found
 */
export function loadMarkdownText() {
    return localStorage.getItem(STORAGE_KEYS.MARKDOWN_TEXT);
}

/**
 * Saves the current view mode preference.
 *
 * @param {string} mode - The view mode ('markdown', 'both', or 'preview')
 */
export function saveViewMode(mode) {
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
}

/**
 * Loads the saved view mode preference.
 *
 * @returns {string} The saved view mode, or 'both' as default
 */
export function loadViewMode() {
    return localStorage.getItem(STORAGE_KEYS.VIEW_MODE) || 'both';
}

/**
 * Saves the current theme preference.
 *
 * @param {string} theme - The theme name
 */
export function saveTheme(theme) {
    if (theme) {
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } else {
        localStorage.removeItem(STORAGE_KEYS.THEME);
    }
}

/**
 * Loads the saved theme preference.
 *
 * @returns {string} The saved theme name, or empty string if not set
 */
export function loadTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || '';
}

/**
 * Saves the preview font preference.
 *
 * @param {string} font - The font family value
 */
export function saveFont(font) {
    localStorage.setItem(STORAGE_KEYS.FONT, font);
}

/**
 * Loads the saved preview font preference.
 *
 * @returns {string} The saved font family, or 'inherit' as default
 */
export function loadFont() {
    return localStorage.getItem(STORAGE_KEYS.FONT) || 'inherit';
}

/**
 * Saves the sync scroll preference.
 *
 * @param {boolean} enabled - Whether sync scroll is enabled
 */
export function saveSyncScroll(enabled) {
    localStorage.setItem(STORAGE_KEYS.SYNC_SCROLL, enabled.toString());
}

/**
 * Loads the sync scroll preference.
 *
 * @returns {boolean|null} The saved preference, or null if not set
 */
export function loadSyncScroll() {
    const saved = localStorage.getItem(STORAGE_KEYS.SYNC_SCROLL);
    return saved !== null ? saved === 'true' : null;
}
