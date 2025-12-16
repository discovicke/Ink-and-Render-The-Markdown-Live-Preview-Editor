'use strict';

import {Parser, Renderer, Tokenizer} from "./AST.js";

const inputText = document.querySelector('#input');
const outputText = document.querySelector('#preview');
const markdownSection = document.querySelector('#markdown');
const previewSection = document.querySelector('#preview');
const syncCheckbox = document.querySelector('#sync-scroll');

let isSyncingFromMarkdown = false;
let isSyncingFromPreview = false;

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
    const lines = textarea.value.split('\n').length;
    const lineNumbers = document.querySelector('#line-numbers');

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPosition);
    const currentLine = textBeforeCursor.split('\n').length;

    lineNumbers.innerHTML = Array.from({length: lines}, (_, i) => {
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

inputText.addEventListener('click', updateLineNumbers);
inputText.addEventListener('keyup', updateLineNumbers);

// Initial rendering
loadFromLocalStorage();
resizeTextarea();
updateLineNumbers();
outputText.innerHTML = parseMarkdown(inputText.value);