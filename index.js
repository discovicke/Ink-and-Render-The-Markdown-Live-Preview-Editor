'use strict';

import {Parser, Renderer, Tokenizer} from "./AST.js";

const inputText = document.querySelector('#input');
const outputText = document.querySelector('#preview');

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
inputText.addEventListener('input', () => {
    updateLineNumbers();
    outputText.innerHTML = parseMarkdown(inputText.value);
});

inputText.addEventListener('click', updateLineNumbers);
inputText.addEventListener('keyup', updateLineNumbers);

// Initial rendering
updateLineNumbers();
outputText.innerHTML = parseMarkdown(inputText.value);