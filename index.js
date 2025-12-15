const inputText = document.querySelector('#input');
const outputText = document.querySelector('#preview');

inputText.addEventListener('input', copyText);
copyText();

function copyText() {
    const dirty = inputText.value;
    const unsafeRegex = new RegExp('on[a-zA-Z]+\\s*=\\s*(".*?"|\'.*?\')', 'gm');
    const clean = dirty.replaceAll(unsafeRegex, '');
    outputText.innerHTML = clean;
}

copyText();