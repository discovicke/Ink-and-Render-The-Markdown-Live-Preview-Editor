'use strict';

import {Parser, Renderer, Tokenizer} from "./AST.js";

const inputText = document.querySelector('#input');
const outputText = document.querySelector('#preview');

const rules = [
    { pattern: /^######\s+(.+)$/gm, replacement: '<h6>$1</h6>' },
    { pattern: /^#####\s+(.+)$/gm, replacement: '<h5>$1</h5>' },
    { pattern: /^####\s+(.+)$/gm, replacement: '<h4>$1</h4>' },
    { pattern: /^###\s+(.+)$/gm, replacement: '<h3>$1</h3>' },
    { pattern: /^##\s+(.+)$/gm, replacement: '<h2>$1</h2>' },
    { pattern: /^#\s+(.+)$/gm, replacement: '<h1>$1</h1>' },

    { pattern: /\*\*(.+?)\*\*/g, replacement: '<strong>$1</strong>' },
    { pattern: /__(.+?)__/g, replacement: '<strong>$1</strong>' },

    { pattern: /\*(.+?)\*/g, replacement: '<em>$1</em>' },
    { pattern: /_(.+?)_/g, replacement: '<em>$1</em>' },

    { pattern: /  \n/g, replacement: '<br>' },
    { pattern: /\n\n+/g, replacement: '</p><p>' },
];
/*
function parseMarkdown(text) {
    if (!text.trim()) return '';

    let html = text;

    for (const rule of rules) {
        html = html.replace(rule.pattern, rule.replacement);
    }

    return '<p>' + html + '</p>';
}

function copyText() {
    const dirty = inputText.value;
    const unsafeRegex = /on[a-zA-Z]+\s*=\s*(".*?"|'.*?')/gm;
    const clean = dirty.replaceAll(unsafeRegex, '');
    outputText.innerHTML = parseMarkdown(clean);
}

 */

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

inputText.addEventListener('input', () => {
    outputText.innerHTML = parseMarkdown(inputText.value);
});

// Initial rendering
outputText.innerHTML = parseMarkdown(inputText.value);