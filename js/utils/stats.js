'use strict';

/**
 * =============================================================================
 * STATS MODULE
 * =============================================================================
 * Calculates and displays document statistics including word count,
 * character count, and estimated reading time.
 * =============================================================================
 */

/**
 * Calculates document statistics from text content.
 *
 * @param {string} text - The text to analyze
 * @returns {{wordCount: number, charCount: number, readingTimeMinutes: number}}
 */
export function calculateStats(text) {
    // Character count (including spaces)
    const charCount = text.length;

    // Word count (split by whitespace and filter out empty strings)
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = text.trim().length === 0 ? 0 : words.length;

    // Reading time calculation (average reading speed: 200 words per minute)
    const readingTimeMinutes = Math.ceil(wordCount / 200);

    return {
        wordCount,
        charCount,
        readingTimeMinutes
    };
}

/**
 * Formats reading time for display.
 *
 * @param {number} minutes - The reading time in minutes
 * @returns {string} Formatted reading time string
 */
export function formatReadingTime(minutes) {
    if (minutes === 0) return '~0 min read';
    if (minutes === 1) return '~1 min read';
    return `~${minutes} min read`;
}

/**
 * Formats word count for display.
 *
 * @param {number} count - The word count
 * @returns {string} Formatted word count string
 */
export function formatWordCount(count) {
    return count === 1 ? '1 word' : `${count} words`;
}

/**
 * Formats character count for display.
 *
 * @param {number} count - The character count
 * @returns {string} Formatted character count string
 */
export function formatCharCount(count) {
    return count === 1 ? '1 char' : `${count} chars`;
}

/**
 * Updates the stats display elements with current text statistics.
 *
 * @param {string} text - The text to analyze
 * @param {HTMLElement} wordCountEl - The word count display element
 * @param {HTMLElement} charCountEl - The character count display element
 * @param {HTMLElement} readTimeEl - The reading time display element
 */
export function updateStatsDisplay(text, wordCountEl, charCountEl, readTimeEl) {
    const stats = calculateStats(text);

    if (wordCountEl) {
        wordCountEl.textContent = formatWordCount(stats.wordCount);
    }

    if (charCountEl) {
        charCountEl.textContent = formatCharCount(stats.charCount);
    }

    if (readTimeEl) {
        readTimeEl.textContent = formatReadingTime(stats.readingTimeMinutes);
    }
}
