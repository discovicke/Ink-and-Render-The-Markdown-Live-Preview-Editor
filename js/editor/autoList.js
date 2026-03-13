'use strict';

/**
 * =============================================================================
 * AUTO-LIST MODULE
 * =============================================================================
 * When the user presses Enter inside a list, blockquote, or checklist,
 * the next line automatically gets the same prefix. If the current line's
 * content is *just* the prefix (empty list item), pressing Enter removes
 * the prefix and exits the list.
 *
 * Supports:
 *  - Unordered lists: - , * , + 
 *  - Ordered lists: 1. , 2. , etc. (auto-increments)
 *  - Checklists: - [ ] 
 *  - Blockquotes: > 
 *  - Indented variants of all of the above
 *
 * =============================================================================
 */

// Patterns that match the full prefix at the start of a line
const LIST_PATTERNS = [
    {
        // Checklist: "  - [ ] " or "  - [x] "
        regex: /^(\s*)[-*+]\s+\[[ xX]]\s+/,
        continueWith: (match) => `${match[1]}- [ ] `,
    },
    {
        // Ordered list: "  1. "
        regex: /^(\s*)(\d+)\.\s+/,
        continueWith: (match) => `${match[1]}${parseInt(match[2], 10) + 1}. `,
    },
    {
        // Unordered list: "  - " or "  * " or "  + "
        regex: /^(\s*)([-*+])\s+/,
        continueWith: (match) => `${match[1]}${match[2]} `,
    },
    {
        // Blockquote: "> "
        regex: /^(\s*>\s*)+/,
        continueWith: (match) => match[0],
    },
];

/**
 * Sets up auto-list continuation on Enter key.
 *
 * @param {HTMLTextAreaElement} textarea - The editor textarea
 * @param {Function} onChange - Callback after modification (updateAllUI)
 */
export function setupAutoList(textarea, onChange) {
    if (!textarea) return;

    textarea.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        // Don't interfere with Shift+Enter (literal newline) or Ctrl/Meta combos
        if (e.shiftKey || e.ctrlKey || e.metaKey) return;

        const { selectionStart: start, selectionEnd: end, value } = textarea;

        // Only act when cursor is a point (no selection)
        if (start !== end) return;

        // Find the current line
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const currentLine = value.slice(lineStart, start);

        // Try each pattern
        for (const { regex, continueWith } of LIST_PATTERNS) {
            const match = currentLine.match(regex);
            if (!match) continue;

            const prefix = match[0];
            const contentAfterPrefix = currentLine.slice(prefix.length);

            // If the line is JUST the prefix (empty item), remove it and exit list
            if (contentAfterPrefix.trim() === '') {
                e.preventDefault();
                // Remove the prefix from the current line and just insert a newline
                textarea.selectionStart = lineStart;
                textarea.selectionEnd = start;
                document.execCommand('insertText', false, '\n');
                if (onChange) onChange();
                return;
            }

            // Otherwise, continue the list on the next line
            e.preventDefault();
            const newPrefix = continueWith(match);
            document.execCommand('insertText', false, '\n' + newPrefix);
            if (onChange) onChange();
            return;
        }
    });
}

