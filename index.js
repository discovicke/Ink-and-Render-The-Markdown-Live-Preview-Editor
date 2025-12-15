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

    { pattern: /\n\n+/g, replacement: '</p><p>' },
];

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

inputText.addEventListener('input', copyText);