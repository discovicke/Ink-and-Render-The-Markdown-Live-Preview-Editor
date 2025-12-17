'use strict';

import {Parser, Renderer, Tokenizer} from "./AST.js";

const inputText = document.querySelector('#input');
const outputText = document.querySelector('#preview');
const markdownSection = document.querySelector('#markdown');
const previewSection = document.querySelector('#preview');
const syncCheckbox = document.querySelector('#sync-scroll');
const mirrorHighlight = document.querySelector('#text-highlight');
const themeSelect = document.querySelector('#theme-select');
const fontSelect = document.querySelector('#font-select');

let isSyncingFromMarkdown = false;
let isSyncingFromPreview = false;

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
});

markdownSection.addEventListener('scroll', () => {
    syncScroll(
        markdownSection,
        previewSection,
        { value: isSyncingFromMarkdown },
        { value: isSyncingFromPreview }
    );
});

previewSection.addEventListener('scroll', () => {
    syncScroll(
        previewSection,
        markdownSection,
        { value: isSyncingFromPreview },
        { value: isSyncingFromMarkdown }
    );
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
    }
});


inputText.addEventListener('click', updateLineNumbers);
inputText.addEventListener('keyup', updateLineNumbers);

// Initial rendering
loadFromLocalStorage();
resizeTextarea();
updateLineNumbers();
outputText.innerHTML = parseMarkdown(inputText.value);