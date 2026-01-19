'use strict';

import { highlightLine } from './highlight.js';

/**
 * =============================================================================
 * LINE NUMBERS MODULE
 * =============================================================================
 * Handles the display and synchronization of line numbers in the editor.
 * Also manages the mirror highlight overlay for syntax highlighting.
 * =============================================================================
 */

/**
 * Updates line numbers and mirror highlight based on current textarea content.
 * Highlights the current line where the cursor is positioned.
 *
 * @param {HTMLTextAreaElement} textarea - The main textarea element
 * @param {HTMLElement} mirrorHighlight - The mirror highlight overlay element
 * @param {HTMLElement} lineNumbersEl - The line numbers container element
 */
export function updateLineNumbers(textarea, mirrorHighlight, lineNumbersEl) {
    const linesArray = textarea.value.split('\n');
    const lineCount = linesArray.length;

    // Clear and rebuild mirror highlight with DOM elements
    mirrorHighlight.innerHTML = '';
    linesArray.forEach(line => {
        const lineElement = highlightLine(line);
        mirrorHighlight.appendChild(lineElement);
    });

    // Find current line based on cursor position
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPosition);
    const currentLine = textBeforeCursor.split('\n').length;

    // Highlight active line in mirror
    const mirrorLines = mirrorHighlight.querySelectorAll('.mirror-line');
    mirrorLines.forEach((line, i) => {
        if (i + 1 === currentLine) {
            line.classList.add('active-mirror-line');
        }
    });

    // Generate line numbers with matching heights
    lineNumbersEl.innerHTML = Array.from({ length: lineCount }, (_, i) => {
        const lineNum = i + 1;
        const isActive = lineNum === currentLine ? ' class="active-line"' : '';
        const lineHeight = mirrorLines[i] ? mirrorLines[i].offsetHeight : 24;
        return `<div${isActive} style="height: ${lineHeight}px; display: flex; align-items: flex-start;">${lineNum}</div>`;
    }).join('');
}

/**
 * Resizes the textarea to fit its content.
 * Also synchronizes the mirror highlight height.
 *
 * @param {HTMLTextAreaElement} textarea - The textarea to resize
 * @param {HTMLElement} mirrorHighlight - The mirror highlight overlay
 */
export function resizeTextarea(textarea, mirrorHighlight) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
    mirrorHighlight.style.height = textarea.style.height;
}
