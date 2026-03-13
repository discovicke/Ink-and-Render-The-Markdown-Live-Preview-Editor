'use strict';

/**
 * =============================================================================
 * AUTO-PAIRS MODULE
 * =============================================================================
 * Automatically inserts matching closing characters when the user types
 * an opening bracket, quote, or markdown delimiter. Also handles typing
 * over closing characters and backspace deletion of empty pairs.
 *
 * =============================================================================
 */

const PAIRS = {
    '(': ')',
    '[': ']',
    '{': '}',
    '"': '"',
    "'": "'",
    '`': '`',
};

/**
 * Sets up auto-pair behavior on a textarea.
 *
 * @param {HTMLTextAreaElement} textarea - The editor textarea
 * @param {Function} onChange - Callback after modification (updateAllUI)
 */
export function setupAutoPairs(textarea, onChange) {
    if (!textarea) return;

    textarea.addEventListener('keydown', (e) => {
        const { selectionStart: start, selectionEnd: end, value } = textarea;
        const selected = value.slice(start, end);

        // Opening character typed
        if (PAIRS[e.key]) {
            const open = e.key;
            const close = PAIRS[open];

            // If text is selected, wrap it
            if (selected) {
                e.preventDefault();
                const wrapped = open + selected + close;
                document.execCommand('insertText', false, wrapped);
                // Select the inner text again
                textarea.selectionStart = start + 1;
                textarea.selectionEnd = end + 1;
                if (onChange) onChange();
                return;
            }

            // For quotes/backtick: don't auto-close if previous char is alphanumeric
            // (likely typing a contraction like "it's")
            if ((open === '"' || open === "'" || open === '`') && start > 0 && /\w/.test(value[start - 1])) {
                return; // Let default behavior happen
            }

            // Insert pair and place cursor between
            e.preventDefault();
            document.execCommand('insertText', false, open + close);
            textarea.selectionStart = start + 1;
            textarea.selectionEnd = start + 1;
            if (onChange) onChange();
            return;
        }

        // Typing a closing character that's already there → skip over it
        const closingChars = Object.values(PAIRS);
        if (closingChars.includes(e.key) && !selected && value[start] === e.key) {
            e.preventDefault();
            textarea.selectionStart = start + 1;
            textarea.selectionEnd = start + 1;
            return;
        }

        // Backspace deletes empty pair
        if (e.key === 'Backspace' && !selected && start > 0) {
            const before = value[start - 1];
            const after = value[start];
            if (PAIRS[before] && PAIRS[before] === after) {
                e.preventDefault();
                // Delete both characters
                textarea.selectionStart = start - 1;
                textarea.selectionEnd = start + 1;
                document.execCommand('insertText', false, '');
                if (onChange) onChange();
            }
        }
    });
}

