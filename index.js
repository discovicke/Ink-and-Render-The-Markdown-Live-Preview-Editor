'use strict';

import { Parser, Renderer, Tokenizer } from "./AST.js";
import { markdownGuideTemplate } from "./markdownGuide.js";

const inputText = document.querySelector('#input');
const outputText = document.querySelector('#preview-content');
const markdown = document.querySelector('#markdown');
const editorArea = document.querySelector('#editor-area');
const previewPane = document.querySelector('#preview-pane');
const syncCheckbox = document.querySelector('#sync-scroll');
const mirrorHighlight = document.querySelector('#text-highlight');
const themeSelect = document.querySelector('#theme-select');
const fontSelect = document.querySelector('#font-select');
const copyButton = document.querySelector('#copy-markdown-btn');
const clearButton = document.querySelector('#clear-markdown-btn');
const resetButton = document.querySelector('#reset-markdown-btn');
const downloadButton = document.querySelector('#download-markdown-btn');
const resizeHandle = document.querySelector('#resize-handle');
const preview = document.querySelector('#preview');
const viewSwitch = document.querySelector('#view-switch');
const viewButtons = viewSwitch ? Array.from(viewSwitch.querySelectorAll('button[data-view]')) : [];
const defaultView = localStorage.getItem('viewMode') || 'both';
const settingsToggle = document.querySelector('#settings-toggle');
const settingsDropdown = document.querySelector('#settings-dropdown');
const wordCountEl = document.querySelector('#word-count');
const charCountEl = document.querySelector('#char-count');
const readTimeEl = document.querySelector('#read-time');
const tocToggle = document.querySelector('#toc-toggle');
const tocPanel = document.querySelector('#toc-panel');
const tocClose = document.querySelector('#toc-close');
const tocContent = document.querySelector('#toc-content');

let isResizing = false;
let isSyncingFromMarkdown = { value: false };
let isSyncingFromPreview = { value: false };
let refreshRaf = null;
let userResized = false;


document.body.classList.add(`view-${defaultView}`);


function highlightLine(line) {
    const div = document.createElement('div');
    div.className = 'mirror-line';

    // Tom rad
    if (!line) {
        div.innerHTML = '&nbsp;';
        return div;
    }

    // Skapa en wrapper span med rätt klass baserat på radtyp
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

    // Highlight inline elements (länkar, bold, italic)
    const parts = [];
    let i = 0;
    let currentText = '';

    while (i < line.length) {
        // Länkar: [text](url)
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

        // Bold: **text** eller __text__
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

        // Italic: *text* (men inte **)
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

        // Italic: _text_ (men inte __)
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

    // Bygg DOM-strukturen
    if (wrapperClass) {
        const wrapper = document.createElement('span');
        wrapper.className = wrapperClass;

        parts.forEach(part => {
            if (part.type === 'link') {
                const span = document.createElement('span');
                span.className = 'mirrorline-link';
                span.textContent = part.value;
                wrapper.appendChild(span);
            } else if (part.type === 'bold') {
                const span = document.createElement('span');
                span.className = 'mirrorline-bold';
                span.textContent = part.value;
                wrapper.appendChild(span);
            } else if (part.type === 'italic') {
                const span = document.createElement('span');
                span.className = 'mirrorline-italic';
                span.textContent = part.value;
                wrapper.appendChild(span);
            } else {
                const textNode = document.createTextNode(part.value);
                wrapper.appendChild(textNode);
            }
        });

        div.appendChild(wrapper);
    } else {
        // Ingen wrapper, bara inline highlighting
        parts.forEach(part => {
            if (part.type === 'link') {
                const span = document.createElement('span');
                span.className = 'mirrorline-link';
                span.textContent = part.value;
                div.appendChild(span);
            } else if (part.type === 'bold') {
                const span = document.createElement('span');
                span.className = 'mirrorline-bold';
                span.textContent = part.value;
                div.appendChild(span);
            } else if (part.type === 'italic') {
                const span = document.createElement('span');
                span.className = 'mirrorline-italic';
                span.textContent = part.value;
                div.appendChild(span);
            } else {
                const textNode = document.createTextNode(part.value);
                div.appendChild(textNode);
            }
        });
    }

    return div;
}

function parseMarkdown(text) {
    if (!text.trim()) return '';

    try {
        const tokenizer = new Tokenizer(text);
        const tokens = tokenizer.tokenize();

        const parser = new Parser(tokens);
        const ast = parser.parse();

        const renderer = new Renderer();
        return renderer.render(ast);

    } catch (error) {
        console.error('Parsing error:', error);
        return '<p>Ett fel uppstod vid parsing</p>';
    }
}

function syncScroll(from, to, fromFlag, toFlag) {
    if (!syncCheckbox.checked) return;
    if (toFlag.value) return;

    fromFlag.value = true;

    const fromScrollHeight = from.scrollHeight - from.clientHeight;
    const toScrollHeight = to.scrollHeight - to.clientHeight;

    const ratio = fromScrollHeight > 0
        ? from.scrollTop / fromScrollHeight
        : 0;

    to.scrollTop = ratio * toScrollHeight;

    requestAnimationFrame(() => {
        fromFlag.value = false;
    });
}

function updateStats() {
    const text = inputText.value;

    // Character count (including spaces)
    const charCount = text.length;

    // Word count (split by whitespace and filter out empty strings)
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = text.trim().length === 0 ? 0 : words.length;

    // Reading time calculation (average reading speed: 200 words per minute)
    const readingTimeMinutes = Math.ceil(wordCount / 200);
    const readTimeText = readingTimeMinutes === 0 ? '~0 min read' :
                         readingTimeMinutes === 1 ? '~1 min read' :
                         `~${readingTimeMinutes} min read`;

    // Update UI
    if (wordCountEl) {
        wordCountEl.textContent = wordCount === 1 ? '1 word' : `${wordCount} words`;
    }

    if (charCountEl) {
        charCountEl.textContent = charCount === 1 ? '1 char' : `${charCount} chars`;
    }

    if (readTimeEl) {
        readTimeEl.textContent = readTimeText;
    }
}

function generateTableOfContents() {
    if (!tocContent || !outputText) return;

    // Find all headings in the preview
    const headings = outputText.querySelectorAll('h1, h2, h3, h4, h5, h6');

    if (headings.length === 0) {
        tocContent.innerHTML = '';
        return;
    }

    // Generate unique IDs for headings if they don't have one
    headings.forEach((heading, index) => {
        if (!heading.id) {
            const text = heading.textContent.trim();
            heading.id = `heading-${text.toLowerCase().replace(/[^\w]+/g, '-')}-${index}`;
        }
    });

    // Build the ToC HTML
    const tocItems = Array.from(headings).map((heading) => {
        const level = heading.tagName.toLowerCase();
        const text = heading.textContent.trim();
        const id = heading.id;

        return `<li><a href="#${id}" class="toc-${level}" data-target="${id}">${text}</a></li>`;
    }).join('');

    tocContent.innerHTML = `<ul>${tocItems}</ul>`;

    // Add click handlers for smooth scrolling
    tocContent.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // Smooth scroll to the heading
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Update active state
                tocContent.querySelectorAll('a').forEach(a => a.classList.remove('active'));
                link.classList.add('active');

                // Close ToC on mobile after clicking
                if (window.innerWidth <= 500 && tocPanel) {
                    tocPanel.classList.add('hidden');
                }
            }
        });
    });
}

function updateActiveToC() {
    if (!tocContent || !previewPane) return;

    const headings = outputText.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) return;

    // Find which heading is currently in view
    const scrollPosition = previewPane.scrollTop + 100; // Offset for better UX

    let activeHeading = null;
    headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        const headingTop = rect.top + previewPane.scrollTop;

        if (headingTop <= scrollPosition) {
            activeHeading = heading;
        }
    });

    // Update active state in ToC
    if (activeHeading) {
        tocContent.querySelectorAll('a').forEach(a => a.classList.remove('active'));
        const activeLink = tocContent.querySelector(`a[data-target="${activeHeading.id}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}

function updateViewIcons(activeMode) {
    if (!viewButtons.length) return;
    viewButtons.forEach((btn) => {
        const mode = btn.getAttribute('data-view');
        const iconBase = btn.getAttribute('data-icon');
        const img = btn.querySelector('svg');
        if (!img || !iconBase) return;

        const isActive = mode === activeMode;
        const fileName = isActive
            ? `${iconBase}(select).svg`
            : `${iconBase}.svg`;
        img.src = `./icons/${fileName}`;
    });
}

function refreshLayout() {
    if (refreshRaf) cancelAnimationFrame(refreshRaf);
    refreshRaf = requestAnimationFrame(() => {
        try {
            resizeTextarea();
            updateLineNumbers();
        } finally {
            refreshRaf = null;
        }
    });
}

function setViewMode(mode) {
    document.body.classList.remove('view-markdown', 'view-both', 'view-preview');
    document.body.classList.add(`view-${mode}`);
    localStorage.setItem('viewMode', mode);
    updateViewIcons(mode);

    if (mode === 'both') {
        if (!userResized) {
            markdown.style.width = '';
            preview.style.width = '';
            markdown.style.flex = '1 1 0';
            preview.style.flex = '1 1 0';
        } else {
            markdown.style.flex = '0 0 auto';
            preview.style.flex = '0 0 auto';
        }
    } else if (mode === 'markdown') {
        markdown.style.width = '';
        markdown.style.flex = '1 1 0';

        preview.style.width = '';
        preview.style.flex = '';
    } else if (mode === 'preview') {
        preview.style.width = '';
        preview.style.flex = '1 1 0';

        markdown.style.width = '';
        markdown.style.flex = '';
    }

    // allow the DOM to settle then refresh layout (rAF already debounced inside)
    setTimeout(refreshLayout, 0);
    resizeTextarea();
    updateLineNumbers();
}

function updateLineNumbers() {
    const textarea = inputText;
    const linesArray = textarea.value.split('\n');
    const lineCount = linesArray.length;

    const lineNumbers = document.querySelector('#line-numbers');

    // Clear and rebuild mirror highlight with DOM elements
    mirrorHighlight.innerHTML = '';
    linesArray.forEach(line => {
        const lineElement = highlightLine(line);
        mirrorHighlight.appendChild(lineElement);
    });

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPosition);
    const currentLine = textBeforeCursor.split('\n').length;

    const mirrorLines = mirrorHighlight.querySelectorAll('.mirror-line');

    mirrorLines.forEach((line, i) => {
        if (i + 1 === currentLine) {
            line.classList.add('active-mirror-line');
        }
    });

    lineNumbers.innerHTML = Array.from({length: lineCount}, (_, i) => {
        const lineNum = i + 1;
        const isActive = lineNum === currentLine
            ? ' class="active-line"'
            : '';
        const lineHeight = mirrorLines[i] ? mirrorLines[i].offsetHeight : 24;
        return `<div${isActive} style="height: ${lineHeight}px; display: flex; align-items: flex-start;">${lineNum}</div>`;
    }).join('');
}

function resizeTextarea() {
    inputText.style.height = 'auto';
    inputText.style.height = inputText.scrollHeight + 'px';
    mirrorHighlight.style.height = inputText.style.height;

}

function loadFromLocalStorage() {
    const savedText = localStorage.getItem('markdownText');
    if (savedText !== null) {
        inputText.value = savedText;
    }
}

function saveToLocalStorage() {
    localStorage.setItem('markdownText', inputText.value);
}

async function copyMarkdownToClipboard() {
    if (!inputText) return;

    const text = inputText.value || '';

    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            console.info('Markdown copied to clipboard');
        } catch (err) {
            console.warn('navigator.clipboard.writeText failed, falling back to execCommand', err);
        }
    }
}

if (viewSwitch) {
    viewSwitch.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-view]');
        if (!btn) return;
        const mode = btn.getAttribute('data-view');
        setViewMode(mode);
    });
}

if (settingsToggle && settingsDropdown) {
    document.body.appendChild(settingsDropdown);
    settingsDropdown.style.position = 'absolute';
    settingsDropdown.style.minWidth = '200px';

    const positionDropdown = () => {
        const btnRect = settingsToggle.getBoundingClientRect();
        const top = window.scrollY + btnRect.bottom + 8;
        const right = window.innerWidth - (window.scrollX + btnRect.right);
        settingsDropdown.style.top = `${top}px`;
        settingsDropdown.style.right = `${right}px`;
    };

    settingsToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsDropdown.classList.toggle('hidden');
        if (!settingsDropdown.classList.contains('hidden')) {
            positionDropdown();
        }
    });

    window.addEventListener('resize', () => {
        if (!settingsDropdown.classList.contains('hidden')) positionDropdown();
    });
    window.addEventListener('scroll', () => {
        if (!settingsDropdown.classList.contains('hidden')) positionDropdown();
    }, true);

    document.addEventListener('click', (e) => {
        if (settingsDropdown.classList.contains('hidden')) return;
        if (!settingsDropdown.contains(e.target) && e.target !== settingsToggle) {
            settingsDropdown.classList.add('hidden');
        }
    });
}

if (resizeHandle) {
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isResizing = true;
        userResized = true;
        document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const mainRect = document.querySelector('main').getBoundingClientRect();
        const minWidth = 150;

        let newMarkdownWidth = e.clientX - mainRect.left;
        let newPreviewWidth = mainRect.right - e.clientX;

        if (newMarkdownWidth < minWidth || newPreviewWidth < minWidth) return;

        markdown.style.flex = '0 0 auto';
        preview.style.flex = '0 0 auto';

        markdown.style.width = newMarkdownWidth + 'px';
        preview.style.width = newPreviewWidth + 'px';

        refreshLayout();
    });

    window.addEventListener('mouseup', () => {
        if (!isResizing) return;
        isResizing = false;
        document.body.style.userSelect = '';
        refreshLayout();
    });

    resizeHandle.addEventListener('dblclick', (e) => {
        e.preventDefault();

        markdown.style.width = '';
        preview.style.width = '';

        markdown.style.flex = '1 1 0';
        preview.style.flex = '1 1 0';

        userResized = false;
        refreshLayout();
    });

}


if (clearButton) {
    clearButton.addEventListener('click', (event) => {
        event.preventDefault();

        if (!inputText.value.trim()) return;

        const confirmed = window.confirm('Är du säker på att du vill rensa din markdowntext?');
        if (!confirmed) return;

        inputText.value = '';
        outputText.innerHTML = '';
        mirrorHighlight.innerHTML = '';
        updateLineNumbers();
        resizeTextarea();
        saveToLocalStorage();
        updateClearButtonState();
        updateStats();
        generateTableOfContents();
    });
}

if (resetButton) {
    resetButton.addEventListener('click', (event) => {
        event.preventDefault();

        inputText.value = markdownGuideTemplate;
        outputText.innerHTML = parseMarkdown(inputText.value);
        updateLineNumbers();
        resizeTextarea();
        saveToLocalStorage();
        updateClearButtonState();
        updateStats();
        generateTableOfContents();
    });
}

if (downloadButton) {
    downloadButton.addEventListener('click', (event) => {
        event.preventDefault();

        const content = inputText.value;
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    });
}


const savedTheme = localStorage.getItem('editorTheme') || '';
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeSelect.value = savedTheme;
}

const savedFont = localStorage.getItem('previewFont') || 'inherit';
document.documentElement.style.setProperty('--preview-font-family', savedFont);
if (fontSelect) {
    fontSelect.value = savedFont;
}

themeSelect.addEventListener('change', (e) => {
    const value = e.target.value;

    if (value) {
        document.documentElement.setAttribute('data-theme', value);
        localStorage.setItem('editorTheme', value);
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.removeItem('editorTheme');
    }
});

fontSelect.addEventListener('change', (e) => {
    const value = e.target.value || 'inherit';
    document.documentElement.style.setProperty('--preview-font-family', value);
    localStorage.setItem('previewFont', value);
});

// Sync scroll preference
const savedSyncScroll = localStorage.getItem('syncScroll');
if (savedSyncScroll !== null) {
    syncCheckbox.checked = savedSyncScroll === 'true';
}

syncCheckbox.addEventListener('change', () => {
    localStorage.setItem('syncScroll', syncCheckbox.checked);
});


inputText.addEventListener('input', () => {
    updateLineNumbers();
    resizeTextarea();
    outputText.innerHTML = parseMarkdown(inputText.value);
    saveToLocalStorage();
    updateClearButtonState();
    updateStats();
    generateTableOfContents();
});


editorArea.addEventListener('scroll', () => {
    syncScroll(
        editorArea,
        previewPane,
        isSyncingFromMarkdown,
        isSyncingFromPreview
    );
});

previewPane.addEventListener('scroll', () => {
    syncScroll(
        previewPane,
        editorArea,
        isSyncingFromPreview,
        isSyncingFromMarkdown
    );
    updateActiveToC();
});

// ToC toggle functionality
if (tocToggle && tocPanel) {
    tocToggle.addEventListener('click', () => {
        tocPanel.classList.toggle('hidden');
    });
}

if (tocClose && tocPanel) {
    tocClose.addEventListener('click', () => {
        tocPanel.classList.add('hidden');
    });
}

// Close ToC when clicking outside
document.addEventListener('click', (e) => {
    if (tocPanel && !tocPanel.classList.contains('hidden')) {
        if (!tocPanel.contains(e.target) && !tocToggle.contains(e.target)) {
            tocPanel.classList.add('hidden');
        }
    }
});

previewPane.addEventListener('click', async (e) => {
    const btn = e.target.closest('.code-copy-btn');
    if (!btn) return;

    const code = btn.getAttribute('data-code')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    try {
        await navigator.clipboard.writeText(code);
        btn.textContent = 'COPIED';
        setTimeout(() => { btn.textContent = 'COPY'; }, 1000);
    } catch (err) {
        console.error('Copy failed', err);
    }
});

inputText.tabIndex = 0;

inputText.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        e.stopImmediatePropagation();

        const start = inputText.selectionStart;
        const end = inputText.selectionEnd;
        const value = inputText.value;
        const insert = '    ';

        inputText.value = value.slice(0, start) + insert + value.slice(end);

        const newPos = start + insert.length;
        inputText.selectionStart = newPos;
        inputText.selectionEnd = newPos;

        updateLineNumbers();
        resizeTextarea();
        outputText.innerHTML = parseMarkdown(inputText.value);
        saveToLocalStorage();
        updateClearButtonState();
    }
});


inputText.addEventListener('click', updateLineNumbers);
inputText.addEventListener('keyup', updateLineNumbers);

if (copyButton) {
    copyButton.addEventListener('click', (event) => {
        event.preventDefault();
        copyMarkdownToClipboard();
    });
}

function updateClearButtonState() {
    if (!clearButton) return;
    clearButton.disabled = !inputText.value.trim();
}

window.addEventListener('resize', refreshLayout);



// Initial rendering
loadFromLocalStorage();
resizeTextarea();
updateLineNumbers();
outputText.innerHTML = parseMarkdown(inputText.value);
updateClearButtonState();
updateStats();
generateTableOfContents();
updateViewIcons(defaultView);
