'use strict';

import { Parser, Renderer, Tokenizer } from "./AST.js";
import { markdownGuideTemplate } from "./markdownGuide.js";

const inputText = document.querySelector('#input');
const outputText = document.querySelector('#preview-content');
const markdown = document.querySelector('#markdown');
const previewSection = document.querySelector('#preview');
const syncCheckbox = document.querySelector('#sync-scroll');
const mirrorHighlight = document.querySelector('#text-highlight');
const themeSelect = document.querySelector('#theme-select');
const fontSelect = document.querySelector('#font-select');
const copyButton = document.querySelector('#copy-markdown-btn');
const clearButton = document.querySelector('#clear-markdown-btn');
const resetButton = document.querySelector('#reset-markdown-btn');
const resizeHandle = document.querySelector('#resize-handle');
const previewWrapper = document.querySelector('#preview-wrapper');
const viewSwitch = document.querySelector('#view-switch');
const viewButtons = viewSwitch ? Array.from(viewSwitch.querySelectorAll('button[data-view]')) : [];
const defaultView = localStorage.getItem('viewMode') || 'both';

let isResizing = false;
let isSyncingFromMarkdown = false;
let isSyncingFromPreview = false;

document.body.classList.add(`view-${defaultView}`);


function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function highlightLine(line) {
    let html = escapeHtml(line);

    if (/^```/.test(line)) {
        html = `<span class="mirrorline-code">${html}</span>`;
    } else if (/^#{1,6}\s/.test(line)) {
        html = `<span class="mirrorline-heading">${html}</span>`;
    } else if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
        html = `<span class="mirrorline-list">${html}</span>`;
    } else if (/^>\s*/.test(line)) {
        html = `<span class="mirrorline-quote">${html}</span>`;
    }

    html = html.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (_m, text, url) =>
            `<span class="mirrorline-link">[${escapeHtml(text)}](${escapeHtml(url)})</span>`
    );

    html = html
        .replace(/\*\*([^*]+)\*\*/g, '<span class="mirrorline-bold">**$1**</span>')
        .replace(/__([^_]+)__/g, '<span class="mirrorline-bold">__$1__</span>');

    html = html
        .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<span class="mirrorline-italic">*$2*</span>')
        .replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1<span class="mirrorline-italic">_$2_</span>');

    return `<div class="mirror-line">${html || '&nbsp;'}</div>`;

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
    if (fromFlag.value) return;

    fromFlag.value = true;

    const fromScrollHeight = from.scrollHeight - from.clientHeight;
    const toScrollHeight = to.scrollHeight - to.clientHeight;

    const ratio = fromScrollHeight > 0
        ? from.scrollTop / fromScrollHeight
        : 0;

    to.scrollTop = ratio * toScrollHeight;

    fromFlag.value = false;
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

function setViewMode(mode) {
    document.body.classList.remove('view-markdown', 'view-both', 'view-preview');
    document.body.classList.add(`view-${mode}`);
    localStorage.setItem('viewMode', mode);
    updateViewIcons(mode);
}

function updateLineNumbers() {
    const textarea = inputText;
    const linesArray = textarea.value.split('\n');
    const lineCount = linesArray.length;

    const lineNumbers = document.querySelector('#line-numbers');

    mirrorHighlight.innerHTML = linesArray.map(highlightLine).join('');

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPosition);
    const currentLine = textBeforeCursor.split('\n').length;

    lineNumbers.innerHTML = Array.from({length: lineCount}, (_, i) => {
        const lineNum = i + 1;
        const isActive = lineNum === currentLine
            ? ' class="active-line"'
            : '';
        return `<div${isActive}>${lineNum}</div>`;
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

if (resizeHandle) {
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isResizing = true;
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
        previewWrapper.style.flex = '0 0 auto';

        markdown.style.width = newMarkdownWidth + 'px';
        previewWrapper.style.width = newPreviewWidth + 'px';
    });

    window.addEventListener('mouseup', () => {
        if (!isResizing) return;
        isResizing = false;
        document.body.style.userSelect = '';
    });

    resizeHandle.addEventListener('dblclick', (e) => {
        e.preventDefault();

        markdown.style.width = '';
        previewWrapper.style.width = '';

        markdown.style.flex = '1 1 0';
        previewWrapper.style.flex = '1 1 0';
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


inputText.addEventListener('input', () => {
    updateLineNumbers();
    resizeTextarea();
    outputText.innerHTML = parseMarkdown(inputText.value);
    saveToLocalStorage();
    updateClearButtonState();
});

markdown.addEventListener('scroll', () => {
    syncScroll(
        markdown,
        previewSection,
        { value: isSyncingFromMarkdown },
        { value: isSyncingFromPreview }
    );
});

previewSection.addEventListener('scroll', () => {
    syncScroll(
        previewSection,
        markdown,
        { value: isSyncingFromPreview },
        { value: isSyncingFromMarkdown }
    );
});

previewSection.addEventListener('click', async (e) => {
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



// Initial rendering
loadFromLocalStorage();
resizeTextarea();
updateLineNumbers();
outputText.innerHTML = parseMarkdown(inputText.value);
updateClearButtonState();
updateViewIcons(defaultView);
