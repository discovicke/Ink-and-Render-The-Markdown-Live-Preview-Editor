'use strict';

/**
 * =============================================================================
 * FORMAT TOOLBAR MODULE
 * =============================================================================
 * Provides markdown formatting actions triggered by toolbar buttons or
 * keyboard shortcuts. Works by manipulating the textarea selection and
 * inserting the appropriate markdown syntax.
 *
 * =============================================================================
 */

// =============================================================================
// FORMATTING ACTIONS
// =============================================================================

/**
 * Wraps the current selection with inline markers (e.g. ** for bold).
 * If nothing is selected, inserts markers with placeholder text.
 * Uses execCommand to preserve undo history.
 */
function wrapSelection(textarea, before, after, placeholder) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selected = value.slice(start, end);

    // If selection is already wrapped, unwrap it
    const textBefore = value.slice(Math.max(0, start - before.length), start);
    const textAfter = value.slice(end, end + after.length);

    if (textBefore === before && textAfter === after) {
        // Unwrap: select the whole wrapped region and replace with just the inner text
        textarea.selectionStart = start - before.length;
        textarea.selectionEnd = end + after.length;
        document.execCommand('insertText', false, selected);
        textarea.selectionStart = start - before.length;
        textarea.selectionEnd = end - before.length;
        return;
    }

    const insert = selected || placeholder;
    const replacement = before + insert + after;

    // Replace the selected range (or insert at cursor)
    textarea.selectionStart = start;
    textarea.selectionEnd = end;
    document.execCommand('insertText', false, replacement);

    if (selected) {
        // Keep selection around the wrapped text
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = start + before.length + insert.length;
    } else {
        // Select the placeholder so user can type over it
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = start + before.length + placeholder.length;
    }
}

/**
 * Prefixes each selected line with a string (e.g. `> ` for blockquote).
 * If every line already has the prefix, it removes it instead (toggle).
 * Uses execCommand to preserve undo history.
 */
function prefixLines(textarea, prefix) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    // Expand selection to full lines
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', end);
    const blockEnd = lineEnd === -1 ? value.length : lineEnd;

    const block = value.slice(lineStart, blockEnd);
    const lines = block.split('\n');

    const allPrefixed = lines.every(l => l.startsWith(prefix));

    const newLines = allPrefixed
        ? lines.map(l => l.slice(prefix.length))
        : lines.map(l => prefix + l);

    const replacement = newLines.join('\n');

    // Select the block and replace via execCommand
    textarea.selectionStart = lineStart;
    textarea.selectionEnd = blockEnd;
    document.execCommand('insertText', false, replacement);

    // Restore selection over the changed block
    textarea.selectionStart = lineStart;
    textarea.selectionEnd = lineStart + replacement.length;
}

/**
 * Inserts text at the cursor (no wrapping).
 * Uses execCommand to preserve undo history.
 */
function insertAtCursor(textarea, text) {
    textarea.focus();
    document.execCommand('insertText', false, text);
}

/**
 * Indent selected lines by prepending 4 spaces.
 */
function indentLines(textarea) {
    prefixLines(textarea, '    ');
}

/**
 * Outdent selected lines by removing up to 4 leading spaces.
 * Uses execCommand to preserve undo history.
 */
function outdentLines(textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', end);
    const blockEnd = lineEnd === -1 ? value.length : lineEnd;

    const block = value.slice(lineStart, blockEnd);
    const lines = block.split('\n');

    const newLines = lines.map(l => {
        const match = l.match(/^( {1,4}|\t)/);
        return match ? l.slice(match[0].length) : l;
    });

    const replacement = newLines.join('\n');

    textarea.selectionStart = lineStart;
    textarea.selectionEnd = blockEnd;
    document.execCommand('insertText', false, replacement);

    textarea.selectionStart = lineStart;
    textarea.selectionEnd = lineStart + replacement.length;
}

/**
 * Sets heading level on the current line.
 * Uses execCommand to preserve undo history.
 */
function cycleHeading(textarea, level) {
    const start = textarea.selectionStart;
    const value = textarea.value;

    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', start);
    const blockEnd = lineEnd === -1 ? value.length : lineEnd;

    const line = value.slice(lineStart, blockEnd);
    // Remove any existing heading prefix
    const stripped = line.replace(/^#{1,6}\s*/, '');
    const prefix = '#'.repeat(level) + ' ';
    const newLine = prefix + stripped;

    textarea.selectionStart = lineStart;
    textarea.selectionEnd = blockEnd;
    document.execCommand('insertText', false, newLine);

    textarea.selectionStart = lineStart + newLine.length;
    textarea.selectionEnd = textarea.selectionStart;
}

// =============================================================================
// ACTION MAP
// =============================================================================

const ACTIONS = {
    bold:       (ta) => wrapSelection(ta, '**', '**', 'bold text'),
    italic:     (ta) => wrapSelection(ta, '*', '*', 'italic text'),
    strikethrough: (ta) => wrapSelection(ta, '~~', '~~', 'strikethrough'),
    code:       (ta) => wrapSelection(ta, '`', '`', 'code'),
    h1:         (ta) => cycleHeading(ta, 1),
    h2:         (ta) => cycleHeading(ta, 2),
    h3:         (ta) => cycleHeading(ta, 3),
    quote:      (ta) => prefixLines(ta, '> '),
    ul:         (ta) => prefixLines(ta, '- '),
    ol:         (ta) => prefixLines(ta, '1. '),
    checklist:  (ta) => prefixLines(ta, '- [ ] '),
    hr:         (ta) => insertAtCursor(ta, '\n---\n'),
    link:       (ta) => {
        const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd);
        if (sel) {
            wrapSelection(ta, '[', '](url)', '');
        } else {
            insertAtCursor(ta, '[link text](url)');
            // Select "link text" for easy editing
            const pos = ta.selectionEnd;
            ta.selectionStart = pos - 16 + 1; // position of 'l' in 'link text'
            ta.selectionEnd = pos - 6;         // position after 'text'
        }
    },
    image:      (ta) => {
        const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd);
        if (sel) {
            wrapSelection(ta, '![', '](url)', '');
        } else {
            insertAtCursor(ta, '![alt text](url)');
            const pos = ta.selectionEnd;
            ta.selectionStart = pos - 16 + 2; // position of 'a' in 'alt text'
            ta.selectionEnd = pos - 6;         // position after 'text'
        }
    },
    codeblock:  (ta) => {
        const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd);
        if (sel) {
            wrapSelection(ta, '```\n', '\n```', '');
        } else {
            insertAtCursor(ta, '```\ncode\n```');
            const pos = ta.selectionEnd;
            ta.selectionStart = pos - 7; // select "code"
            ta.selectionEnd = pos - 4;
        }
    },
    indent:     (ta) => indentLines(ta),
    outdent:    (ta) => outdentLines(ta),
    table:      (ta) => {
        const template = '| Header | Header |\n| ------ | ------ |\n| Cell   | Cell   |';
        insertAtCursor(ta, '\n' + template + '\n');
    },
};

// =============================================================================
// KEYBOARD SHORTCUTS
// =============================================================================

const SHORTCUTS = [
    { key: 'b', ctrl: true, shift: false, action: 'bold' },
    { key: 'i', ctrl: true, shift: false, action: 'italic' },
    { key: 'k', ctrl: true, shift: false, action: 'link' },
    { key: 'e', ctrl: true, shift: false, action: 'code' },
    { key: 'd', ctrl: true, shift: true,  action: 'strikethrough' },
    { key: '.', ctrl: true, shift: true,  action: 'quote' },
    { key: '8', ctrl: true, shift: true,  action: 'ul' },
    { key: '7', ctrl: true, shift: true,  action: 'ol' },
];

// =============================================================================
// SETUP
// =============================================================================

/**
 * Initializes the format toolbar.
 * Attaches click handlers to every button with a [data-format] attribute
 * inside the toolbar, and sets up keyboard shortcuts on the textarea.
 *
 * @param {HTMLElement} toolbar - The #format-toolbar element
 * @param {HTMLTextAreaElement} textarea - The editor textarea
 * @param {Function} onChange - Callback invoked after any formatting action (typically updateAllUI)
 */
export function setupFormatToolbar(toolbar, textarea, onChange) {
    if (!toolbar || !textarea) return;

    // Delegate click on toolbar buttons
    toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-format]');
        if (!btn) return;

        const action = btn.dataset.format;
        if (ACTIONS[action]) {
            textarea.focus();
            ACTIONS[action](textarea);
            if (onChange) onChange();
        }
    });

    // Keyboard shortcuts
    textarea.addEventListener('keydown', (e) => {
        for (const shortcut of SHORTCUTS) {
            const ctrlOrMeta = e.ctrlKey || e.metaKey;
            if (
                e.key.toLowerCase() === shortcut.key &&
                ctrlOrMeta === shortcut.ctrl &&
                e.shiftKey === shortcut.shift
            ) {
                e.preventDefault();
                ACTIONS[shortcut.action](textarea);
                if (onChange) onChange();
                return;
            }
        }
    });
}

