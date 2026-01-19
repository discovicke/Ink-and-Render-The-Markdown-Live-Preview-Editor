'use strict';

/**
 * =============================================================================
 * HIGHLIGHT MODULE
 * =============================================================================
 * Handles syntax highlighting for the markdown editor's mirror element.
 * Provides visual feedback for different markdown elements as the user types.
 * =============================================================================
 */

/**
 * Highlights a single line of markdown text with appropriate styling.
 * Detects block-level elements (headings, lists, quotes) and inline elements
 * (bold, italic, links) and wraps them in styled span elements.
 *
 * @param {string} line - The line of text to highlight
 * @returns {HTMLDivElement} A div element containing the highlighted line
 */
export function highlightLine(line) {
    const div = document.createElement('div');
    div.className = 'mirror-line';

    // Empty line
    if (!line) {
        div.innerHTML = '&nbsp;';
        return div;
    }

    // Determine wrapper class based on line type
    let wrapperClass = '';

    if (/^```/.test(line)) {
        wrapperClass = 'mirrorline-code';
    } else if (/^#{1,6}\s/.test(line)) {
        wrapperClass = 'mirrorline-heading';
    } else if (/^\s*[-*+]\s+\[[ xX]\]\s+/.test(line)) {
        wrapperClass = 'mirrorline-checklist';
    } else if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
        wrapperClass = 'mirrorline-list';
    } else if (/^>\s*/.test(line)) {
        wrapperClass = 'mirrorline-quote';
    } else if (/^\[\^[^\]]+\]:/.test(line)) {
        wrapperClass = 'mirrorline-footnote';
    }

    // Parse inline elements (links, bold, italic)
    const parts = parseInlineElements(line);

    // Build DOM structure
    if (wrapperClass) {
        const wrapper = document.createElement('span');
        wrapper.className = wrapperClass;
        appendParts(wrapper, parts);
        div.appendChild(wrapper);
    } else {
        appendParts(div, parts);
    }

    return div;
}

/**
 * Parses a line of text for inline markdown elements.
 *
 * @param {string} line - The line to parse
 * @returns {Array<{type: string, value: string}>} Array of parsed parts
 */
function parseInlineElements(line) {
    const parts = [];
    let i = 0;
    let currentText = '';

    while (i < line.length) {
        // Links: [text](url)
        const linkMatch = line.slice(i).match(/^\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
            if (currentText) {
                parts.push({ type: 'text', value: currentText });
                currentText = '';
            }
            parts.push({ type: 'link', value: linkMatch[0] });
            i += linkMatch[0].length;
            continue;
        }

        // Bold: **text** or __text__
        const boldMatch = line.slice(i).match(/^(\*\*|__)([^*_]+?)\1/);
        if (boldMatch) {
            if (currentText) {
                parts.push({ type: 'text', value: currentText });
                currentText = '';
            }
            parts.push({ type: 'bold', value: boldMatch[0] });
            i += boldMatch[0].length;
            continue;
        }

        // Italic: *text* (but not **)
        if (line[i] === '*' && line[i+1] !== '*') {
            const italicMatch = line.slice(i).match(/^\*([^*]+)\*/);
            if (italicMatch) {
                if (currentText) {
                    parts.push({ type: 'text', value: currentText });
                    currentText = '';
                }
                parts.push({ type: 'italic', value: italicMatch[0] });
                i += italicMatch[0].length;
                continue;
            }
        }

        // Italic: _text_ (but not __)
        if (line[i] === '_' && line[i+1] !== '_' && (i === 0 || line[i-1] !== '_')) {
            const italicMatch = line.slice(i).match(/^_([^_]+)_/);
            if (italicMatch) {
                if (currentText) {
                    parts.push({ type: 'text', value: currentText });
                    currentText = '';
                }
                parts.push({ type: 'italic', value: italicMatch[0] });
                i += italicMatch[0].length;
                continue;
            }
        }

        currentText += line[i];
        i++;
    }

    if (currentText) {
        parts.push({ type: 'text', value: currentText });
    }

    return parts;
}

/**
 * Appends parsed parts to a parent element with appropriate styling.
 *
 * @param {HTMLElement} parent - The parent element to append to
 * @param {Array<{type: string, value: string}>} parts - The parsed parts
 */
function appendParts(parent, parts) {
    parts.forEach(part => {
        if (part.type === 'link') {
            const span = document.createElement('span');
            span.className = 'mirrorline-link';
            span.textContent = part.value;
            parent.appendChild(span);
        } else if (part.type === 'bold') {
            const span = document.createElement('span');
            span.className = 'mirrorline-bold';
            span.textContent = part.value;
            parent.appendChild(span);
        } else if (part.type === 'italic') {
            const span = document.createElement('span');
            span.className = 'mirrorline-italic';
            span.textContent = part.value;
            parent.appendChild(span);
        } else {
            const textNode = document.createTextNode(part.value);
            parent.appendChild(textNode);
        }
    });
}
