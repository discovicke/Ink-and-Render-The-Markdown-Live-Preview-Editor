/*
    ============================================
    TOKENIZER - Steg 1: Dela upp i tokens
    ============================================
*/

export class Tokenizer {
    constructor(text) {
        this.text = text;
        this.pos = 0;
        this.lines = text.split('\n');
        this.currentLine = 0;
    }

    tokenize() {
        const tokens = [];

        while (this.currentLine < this.lines.length) {
            const line = this.lines[this.currentLine];
            const token = this.tokenizeLine(line);

            if (token) {
                tokens.push(token);
            }

            this.currentLine++;
        }

        return tokens;
    }

    tokenizeLine(line) {
        // Tom rad
        if (line.trim() === '') {
            return { type: 'BLANK_LINE' };
        }

        // Horizontal rule / divider
        // Markdown spec typically allows: --- or *** or ___ (with optional surrounding whitespace)
        // We support at least '---' as requested.
        if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
            return { type: 'HORIZONTAL_RULE' };
        }

        // Tabellrad (börjar med "|")
        if (/^\s*\|.*\|\s*$/.test(line)) {
            return this.tokenizeTable(line);
        }

        // Rubriker
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            return {
                type: 'HEADING',
                level: headingMatch[1].length,
                content: headingMatch[2]
            };
        }

        // Checklista
        const checklistMatch = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.+)$/);
        if (checklistMatch) {
            return {
                type: 'CHECKLIST_ITEM',
                indent: checklistMatch[1].length,
                checked: checklistMatch[2].toLowerCase() === 'x',
                content: checklistMatch[3]
            };
        }

        // Lista (punktlista)
        const listMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
        if (listMatch) {
            return {
                type: 'LIST_ITEM',
                indent: listMatch[1].length,
                content: listMatch[2],
                ordered: false
            };
        }

        // Lista (numrerad)
        const orderedMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
        if (orderedMatch) {
            return {
                type: 'LIST_ITEM',
                indent: orderedMatch[1].length,
                content: orderedMatch[3],
                ordered: true
            };
        }

        // Kodblock
        if (line.trim().startsWith('```')) {
            return this.tokenizeCodeBlock();
        }

        // Fotnotdefinition
        const footnoteDefMatch = line.match(/^\[\^([^\]]+)\]:\s*(.+)$/);
        if (footnoteDefMatch) {
            return {
                type: 'FOOTNOTE_DEF',
                id: footnoteDefMatch[1],
                content: footnoteDefMatch[2]
            };
        }

        // Citat
        const quoteMatch = line.match(/^>\s*(.*)$/);
        if (quoteMatch) {
            return {
                type: 'QUOTE',
                content: quoteMatch[1]
            };
        }

        // Vanlig text
        return {
            type: 'TEXT',
            content: line
        };
    }

    tokenizeCodeBlock() {
        const startLine = this.currentLine;
        const lang = this.lines[startLine].trim().substring(3);
        const content = [];

        this.currentLine++;

        while (this.currentLine < this.lines.length) {
            const line = this.lines[this.currentLine];

            if (line.trim().startsWith('```')) {
                return {
                    type: 'CODE_BLOCK',
                    language: lang,
                    content: content.join('\n')
                };
            }

            content.push(line);
            this.currentLine++;
        }

        return {
            type: 'CODE_BLOCK',
            language: lang,
            content: content.join('\n')
        };
    }

tokenizeTable(firstLine) {
    // Read head, separator & all table rows
    const headerLine = firstLine;
    const headerCells = headerLine
        .trim()
        .slice(1, -1)
        .split('|')
        .map(c => c.trim());

    // Kika på nästa rad – ska vara --- \| --- typ
    const next = this.lines[this.currentLine + 1];
    if (!next || !/^\s*\|(?:\s*:?[-]+:?\s*\|)+\s*$/.test(next)) {
        // Inte en riktig tabell -> behandla bara som TEXT
        return {
            type: 'TEXT',
            content: headerLine
        };
    }

    // Hoppa över separatorrad
    this.currentLine += 1;

    const rows = [];
    while (this.currentLine + 1 < this.lines.length) {
        const peek = this.lines[this.currentLine + 1];
        if (!/^\s*\|.*\|\s*$/.test(peek)) break;

        this.currentLine += 1;
        const cells = this.lines[this.currentLine]
            .trim()
            .slice(1, -1)
            .split('|')
            .map(c => c.trim());
        rows.push(cells);
    }

    return {
        type: 'TABLE',
        header: headerCells,
        rows
    };
    }
}
/*
    ============================================
    PARSER - Steg 2: Bygg AST
    ============================================
*/
export class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }

    parse() {
        const ast = {
            type: 'document',
            children: []
        };

        while (this.pos < this.tokens.length) {
            const node = this.parseBlock();
            if (node) {
                ast.children.push(node);
            }
        }

        return ast;
    }

    parseBlock() {
        const token = this.tokens[this.pos];

        if (!token || token.type === 'BLANK_LINE') {
            this.pos++;
            return null;
        }

        switch (token.type) {
            case 'HEADING':
                return this.parseHeading();
            case 'HORIZONTAL_RULE':
                return this.parseHorizontalRule();
            case 'LIST_ITEM':
                return this.parseList();
            case 'CHECKLIST_ITEM':
                return this.parseChecklist();
            case 'CODE_BLOCK':
                return this.parseCodeBlock();
            case 'QUOTE':
                return this.parseQuote();
            case 'TABLE':
                return this.parseTable();
            case 'FOOTNOTE_DEF':
                return this.parseFootnoteDef();
            case 'TEXT':
                return this.parseParagraph();
            default:
                this.pos++;
                return null;
        }
    }

    parseHorizontalRule() {
        this.pos++;
        return {
            type: 'horizontal_rule'
        };
    }

    parseHeading() {
        const token = this.tokens[this.pos++];
        return {
            type: 'heading',
            level: token.level,
            children: this.parseInline(token.content)
        };
    }

    parseList() {
        const startToken = this.tokens[this.pos];
        const rootIndent = startToken.indent;
        const isOrderedRoot = startToken.ordered;

        const stack = [{
            type: isOrderedRoot
                ? 'ordered_list'
                : 'unordered_list',
            indent: rootIndent,
            children: []
        }];

        while (this.pos < this.tokens.length) {
            const token = this.tokens[this.pos];

            if (token.type !== 'LIST_ITEM') break;

            const { indent, ordered, content } = token;

            // if went "up" in indentation -> pop back up in stack
            while (stack.length > 0 && indent < stack[stack.length - 1].indent) {
                stack.pop();
            }

            // if deeper than current indentation -> create list child
            if (indent > stack[stack.length - 1].indent) {
                const newList = {
                    type: ordered
                        ? 'ordered_list'
                        : 'unordered_list',
                    indent,
                    children: []
                };
                const lastItem = stack[stack.length - 1].children[stack[stack.length - 1].children.length - 1];
                if (!lastItem) break;
                if (!lastItem.children) lastItem.children = [];
                lastItem.children.push(newList);
                stack.push(newList);
            }

            // Switch between ordered/unordered on same level -> close
            if (
                indent === stack[stack.length - 1].indent &&
                ((ordered && stack[stack.length - 1].type === 'unordered_list') ||
                    (!ordered && stack[stack.length - 1].type === 'ordered_list'))
            ) {
                break;
            }

            const currentList = stack[stack.length - 1];
            currentList.children.push({
                type: 'list_item',
                children: this.parseInline(content)
            });

            this.pos++;
        }

        const rootList = stack[0];
        delete rootList.indent;
        // rensa hjälpfält
        const clean = (node) => {
            if (!node || !node.children) return;
            node.children.forEach(child => clean(child));
            delete node.indent;
        };
        clean(rootList);

        return rootList;
    }

    parseChecklist() {
        const items = [];

        while (this.pos < this.tokens.length) {
            const token = this.tokens[this.pos];
            if (token.type !== 'CHECKLIST_ITEM') break;

            items.push({
                type: 'checklist_item',
                checked: token.checked,
                children: this.parseInline(token.content)
            });
            this.pos++;
        }

        return {
            type: 'checklist',
            children: items
        };
    }

    parseTable() {
        const token = this.tokens[this.pos++];
        return {
            type: 'table',
            header: token.header.map(cell => this.parseInline(cell)),
            rows: token.rows.map(row =>
                row.map(cell => this.parseInline(cell))
            )
        };
    }

    parseFootnoteDef() {
        const token = this.tokens[this.pos++];
        return {
            type: 'footnote_def',
            id: token.id,
            children: this.parseInline(token.content)
        };
    }


    parseCodeBlock() {
        const token = this.tokens[this.pos++];
        return {
            type: 'code_block',
            language: token.language,
            content: token.content
        };
    }

    parseQuote() {
        const lines = [];

        while (this.pos < this.tokens.length) {
            const token = this.tokens[this.pos];
            if (token.type !== 'QUOTE') break;
            lines.push(token.content);
            this.pos++;
        }

        const innerText = lines.join('\n');
        const innerTokenizer = new Tokenizer(innerText);
        const innerTokens = innerTokenizer.tokenize();
        const innerParser = new Parser(innerTokens);
        const innerAst = innerParser.parse();

        return {
            type: 'blockquote',
            children: innerAst.children
        };
    }


    parseParagraph() {
        const lines = [];

        while (this.pos < this.tokens.length) {
            const token = this.tokens[this.pos];

            if (token.type !== 'TEXT') {
                break;
            }

            lines.push(token.content);
            this.pos++;

            if (this.pos < this.tokens.length &&
                this.tokens[this.pos].type === 'BLANK_LINE') {
                break;
            }
        }

        // Använd \n för att bevara radbrytningar inom paragrafen
        return {
            type: 'paragraph',
            children: this.parseInline(lines.join('\n'))
        };
    }

    // Regel-tabell för inline-formatering
    getInlineRules() {
        return [
            {
                type: 'line_break',
                pattern: /^  \n/,
                handler: (match) => ({
                    type: 'line_break'
                })
            },
            {
                type: 'image',
                pattern: /^!\[([^\]]*)\]\(([^)]+)\)/,
                handler: (match) => ({
                    type: 'image',
                    alt: match[1],
                    url: match[2]
                })
            },
            {
                type: 'footnote_ref',
                pattern: /^\[\^([^\]]+)\]/,
                handler: (match) => ({
                    type: 'footnote_ref',
                    id: match[1]
                })
            },
            {
                type: 'link',
                pattern: /^\[([^\]]+)\]\(([^)]+)\)/,
                handler: (match) => ({
                    type: 'link',
                    text: match[1],
                    url: match[2]
                })
            },
            {
                type: 'code',
                pattern: /^`([^`]+)`/,
                handler: (match) => ({
                    type: 'code',
                    value: match[1]
                })
            },
            {
                type: 'bold',
                pattern: /^\*\*(.+?)\*\*/,
                handler: (match) => ({
                    type: 'bold',
                    children: this.parseInline(match[1])
                })
            },
            {
                type: 'bold',
                pattern: /^__(.+?)__/,
                handler: (match) => ({
                    type: 'bold',
                    children: this.parseInline(match[1])
                })
            },
            {
                type: 'italic',
                pattern: /^\*(.+?)\*/,
                handler: (match) => ({
                    type: 'italic',
                    children: this.parseInline(match[1])
                })
            },
            {
                type: 'italic',
                pattern: /^_(.+?)_/,
                handler: (match) => ({
                    type: 'italic',
                    children: this.parseInline(match[1])
                })
            }
        ];
    }

    parseInline(text) {
        const nodes = [];
        const rules = this.getInlineRules();
        let current = '';
        let i = 0;

        while (i < text.length) {
            let matched = false;
            const remaining = text.substring(i);

            // Testa alla regler i ordning
            for (const rule of rules) {
                const match = remaining.match(rule.pattern);

                if (match) {
                    // Spara eventuell text före matchen
                    if (current) {
                        nodes.push({ type: 'text', value: current });
                        current = '';
                    }

                    // Använd regelns handler för att skapa nod
                    nodes.push(rule.handler(match));

                    i += match[0].length;
                    matched = true;
                    break;
                }
            }

            // Ingen regel matchade, lägg till tecken till current
            if (!matched) {
                current += text[i];
                i++;
            }
        }

        // Lägg till kvarvarande text
        if (current) {
            nodes.push({ type: 'text', value: current });
        }

        return nodes;
    }
}

/*
    ============================================
    RENDERER - Steg 3: Generera HTML från AST
    ============================================
*/

export class Renderer {
    constructor() {
        this.footnotes = [];
    }

    render(ast) {
        // Reset footnotes for each render
        this.footnotes = [];

        // Render main content
        const mainContent = this.renderNode(ast);

        // Render footnotes section at the end if there are any
        if (this.footnotes.length > 0) {
            const footnotesHtml = `
                <hr class="footnotes-separator">
                <section class="footnotes-section">
                    ${this.footnotes.map(fn => `
                        <div class="footnote" id="fn-${this.escapeHtml(fn.id)}">
                            <sup>${this.escapeHtml(fn.id)}</sup> ${this.renderChildren(fn.children)} 
                            <a href="#fnref-${this.escapeHtml(fn.id)}" class="footnote-backref">↩</a>
                        </div>
                    `).join('')}
                </section>
            `;
            return mainContent + footnotesHtml;
        }

        return mainContent;
    }

    renderNode(node) {
        if (!node) return '';

        switch (node.type) {
            case 'document':
                return node.children.map(child => this.renderNode(child)).join('');

            case 'heading':
                const content = this.renderChildren(node.children);
                return `<h${node.level}>${content}</h${node.level}>`;

            case 'horizontal_rule':
                return `<hr class="md-divider">`;

            case 'paragraph':
                return `<p>${this.renderChildren(node.children)}</p>`;

            case 'bold':
                return `<strong>${this.renderChildren(node.children)}</strong>`;

            case 'italic':
                return `<em>${this.renderChildren(node.children)}</em>`;

            case 'code':
                return `<code>${this.escapeHtml(node.value)}</code>`;

            case 'code_block': {
                const lang = node.language ? node.language.toLowerCase() : '';
                let highlighted;

                if (lang === 'js' || lang === 'javascript') {
                    highlighted = this.highlightJavaScript(node.content);
                } else if (lang === 'css') {
                    highlighted = this.highlightCSS(node.content);
                } else if (lang === 'html' || lang === 'htm') {
                    highlighted = this.highlightHTML(node.content);
                } else if (lang === 'csharp' || lang === 'cs' || lang === 'c#') {
                    highlighted = this.highlightCSharp(node.content);
                } else {
                    highlighted = this.escapeHtml(node.content);
                }

                const escaped = this.escapeHtml(node.content);
                const langClass = node.language ? ` class="language-${this.escapeHtml(node.language)}"` : '';
                return `
                    <div class="code-block-wrapper">
                        <button class="code-copy-btn" type="button" data-code="${escaped.replace(/"/g, '&quot;')}">
                            COPY
                        </button>
                        <pre><code${langClass}>${highlighted}</code></pre>
                    </div>`;
                }


            case 'link':
                return `<a href="${this.escapeHtml(node.url)}">${this.escapeHtml(node.text)}</a>`;

            case 'image':
                return `<img src="${this.escapeHtml(node.url)}" alt="${this.escapeHtml(node.alt)}">`;

            case 'unordered_list':
                return `<ul>${this.renderChildren(node.children)}</ul>`;

            case 'ordered_list':
                return `<ol>${this.renderChildren(node.children)}</ol>`;

            case 'list_item':
                return `<li>${this.renderChildren(node.children)}</li>`;

            case 'blockquote':
                return `<blockquote>${this.renderChildren(node.children)}</blockquote>`;

            case 'checklist':
                return `<ul class="checklist">${this.renderChildren(node.children)}</ul>`;

            case 'checklist_item': {
                const checked = node.checked ? ' checked' : '';
                const checkedClass = node.checked ? ' checked' : '';
                return `<li class="checklist-item${checkedClass}"><input type="checkbox"${checked} disabled>${this.renderChildren(node.children)}</li>`;
            }

            case 'footnote_ref':
                return `<sup class="footnote-ref"><a href="#fn-${this.escapeHtml(node.id)}" id="fnref-${this.escapeHtml(node.id)}">[${this.escapeHtml(node.id)}]</a></sup>`;

            case 'footnote_def':
                // Store footnote definition for rendering at the end
                this.footnotes.push(node);
                return '';

            case 'table': {
                const headerHtml = node.header
                    .map(cells => `<th>${this.renderChildren(cells)}</th>`)
                    .join('');
                const bodyHtml = node.rows
                    .map(row =>
                        `<tr>${row.map(cells => `<td>${this.renderChildren(cells)}</td>`).join('')}</tr>`
                    )
                    .join('');
                return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
            }

            case 'line_break':
                return '<br>';

            case 'text':
                return this.escapeHtml(node.value);

            default:
                return '';
        }
    }

    renderChildren(children) {
        if (!children) return '';
        return children.map(child => this.renderNode(child)).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // JavaScript syntax highlighting
    highlightJavaScript(code) {
        const tokens = [];
        let i = 0;

        const keywords = ['if', 'else', 'switch', 'case', 'default', 'for', 'while', 'do', 'break', 'continue', 'return', 'throw', 'try', 'catch', 'finally', 'new', 'delete', 'typeof', 'instanceof', 'in', 'of', 'class', 'extends', 'super', 'this', 'static', 'get', 'set', 'async', 'await', 'yield'];
        const importKeywords = ['import', 'export', 'from', 'as', 'default'];
        const declarationKeywords = ['function', 'let', 'var', 'const'];
        const valueKeywords = ['null', 'undefined', 'true', 'false', 'NaN', 'Infinity'];
        const operators = ['=>', '===', '!==', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '...', '++', '--', '+=', '-=', '*=', '/=', '%=', '**', '+', '-', '*', '/', '%', '<', '>', '!', '=', '&', '|', '^', '~', '?', ':', ';', ',', '.'];

        while (i < code.length) {
            // Multi-line comments
            if (code.slice(i, i + 2) === '/*') {
                let end = code.indexOf('*/', i + 2);
                if (end === -1) end = code.length;
                else end += 2;
                tokens.push({ type: 'comment', value: code.slice(i, end) });
                i = end;
                continue;
            }

            // Single-line comments
            if (code.slice(i, i + 2) === '//') {
                let end = code.indexOf('\n', i);
                if (end === -1) end = code.length;
                tokens.push({ type: 'comment', value: code.slice(i, end) });
                i = end;
                continue;
            }

            // Regex literals (simple detection)
            if (code[i] === '/' && i > 0) {
                const prevNonSpace = code.slice(0, i).trimEnd();
                const lastChar = prevNonSpace[prevNonSpace.length - 1];
                if (['=', '(', ',', '[', '!', '&', '|', ':', ';', '{', '}', '\n'].includes(lastChar) || prevNonSpace.endsWith('return')) {
                    let j = i + 1;
                    let escaped = false;
                    let inClass = false;
                    while (j < code.length) {
                        if (escaped) {
                            escaped = false;
                        } else if (code[j] === '\\') {
                            escaped = true;
                        } else if (code[j] === '[') {
                            inClass = true;
                        } else if (code[j] === ']') {
                            inClass = false;
                        } else if (code[j] === '/' && !inClass) {
                            j++;
                            while (j < code.length && /[gimsuy]/.test(code[j])) j++;
                            tokens.push({ type: 'regex', value: code.slice(i, j) });
                            i = j;
                            break;
                        } else if (code[j] === '\n') {
                            break;
                        }
                        j++;
                    }
                    if (i === j) continue;
                    continue;
                }
            }

            // Strings
            if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
                const quote = code[i];
                let j = i + 1;
                let escaped = false;
                while (j < code.length) {
                    if (escaped) {
                        escaped = false;
                    } else if (code[j] === '\\') {
                        escaped = true;
                    } else if (code[j] === quote) {
                        j++;
                        break;
                    } else if (quote !== '`' && code[j] === '\n') {
                        break;
                    }
                    j++;
                }
                tokens.push({ type: 'string', value: code.slice(i, j) });
                i = j;
                continue;
            }

            // Numbers
            if (/\d/.test(code[i]) || (code[i] === '.' && /\d/.test(code[i + 1]))) {
                let j = i;
                if (code.slice(i, i + 2).toLowerCase() === '0x') {
                    j += 2;
                    while (j < code.length && /[0-9a-fA-F]/.test(code[j])) j++;
                } else if (code.slice(i, i + 2).toLowerCase() === '0b') {
                    j += 2;
                    while (j < code.length && /[01]/.test(code[j])) j++;
                } else {
                    while (j < code.length && /[\d.]/.test(code[j])) j++;
                    if (code[j] === 'e' || code[j] === 'E') {
                        j++;
                        if (code[j] === '+' || code[j] === '-') j++;
                        while (j < code.length && /\d/.test(code[j])) j++;
                    }
                }
                tokens.push({ type: 'number', value: code.slice(i, j) });
                i = j;
                continue;
            }

            // Identifiers and keywords
            if (/[a-zA-Z_$]/.test(code[i])) {
                let j = i;
                while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) j++;
                const word = code.slice(i, j);

                // Check what follows for function detection
                let k = j;
                while (k < code.length && /\s/.test(code[k])) k++;

                if (declarationKeywords.includes(word)) {
                    tokens.push({ type: 'declaration', value: word });
                } else if (word === 'function') {
                    tokens.push({ type: 'declaration', value: word });
                } else if (importKeywords.includes(word)) {
                    tokens.push({ type: 'import', value: word });
                } else if (keywords.includes(word)) {
                    tokens.push({ type: 'keyword', value: word });
                } else if (valueKeywords.includes(word)) {
                    tokens.push({ type: 'value', value: word });
                } else if (code[k] === '(') {
                    tokens.push({ type: 'function', value: word });
                } else {
                    tokens.push({ type: 'identifier', value: word });
                }
                i = j;
                continue;
            }

            // Brackets
            if ('()[]{}'.includes(code[i])) {
                tokens.push({ type: 'bracket', value: code[i] });
                i++;
                continue;
            }

            // Operators
            let matchedOp = null;
            for (const op of operators) {
                if (code.slice(i, i + op.length) === op) {
                    matchedOp = op;
                    break;
                }
            }
            if (matchedOp) {
                tokens.push({ type: 'operator', value: matchedOp });
                i += matchedOp.length;
                continue;
            }

            // Whitespace and other
            tokens.push({ type: 'text', value: code[i] });
            i++;
        }

        return tokens.map(t => {
            const escaped = this.escapeHtml(t.value);
            switch (t.type) {
                case 'comment': return `<span class="hljs-comment">${escaped}</span>`;
                case 'keyword': return `<span class="hljs-keyword">${escaped}</span>`;
                case 'import': return `<span class="hljs-keyword">${escaped}</span>`;
                case 'declaration': return `<span class="hljs-keyword">${escaped}</span>`;
                case 'value': return `<span class="hljs-literal">${escaped}</span>`;
                case 'string': return `<span class="hljs-string">${escaped}</span>`;
                case 'number': return `<span class="hljs-number">${escaped}</span>`;
                case 'regex': return `<span class="hljs-regexp">${escaped}</span>`;
                case 'function': return `<span class="hljs-title function_">${escaped}</span>`;
                case 'operator': return `<span class="hljs-operator">${escaped}</span>`;
                case 'bracket': return `<span class="hljs-punctuation">${escaped}</span>`;
                default: return escaped;
            }
        }).join('');
    }

    // CSS syntax highlighting
    highlightCSS(code) {
        const tokens = [];
        let i = 0;

        while (i < code.length) {
            // Comments
            if (code.slice(i, i + 2) === '/*') {
                let end = code.indexOf('*/', i + 2);
                if (end === -1) end = code.length;
                tokens.push({ type: 'comment', value: code.slice(i, end) });
                i = end;
                continue;
            }

            // Strings
            if (code[i] === '"' || code[i] === "'") {
                const quote = code[i];
                let j = i + 1;
                while (j < code.length && code[j] !== quote && code[j] !== '\n') {
                    if (code[j] === '\\') j++;
                    j++;
                }
                if (code[j] === quote) j++;
                tokens.push({ type: 'string', value: code.slice(i, j) });
                i = j;
                continue;
            }

            // Numbers with units
            if (/\d/.test(code[i]) || (code[i] === '.' && /\d/.test(code[i + 1]))) {
                let j = i;
                while (j < code.length && /[\d.]/.test(code[j])) j++;
                while (j < code.length && /[a-zA-Z%]/.test(code[j])) j++;
                tokens.push({ type: 'number', value: code.slice(i, j) });
                i = j;
                continue;
            }

            // @ rules
            if (code[i] === '@') {
                let j = i + 1;
                while (j < code.length && /[a-zA-Z-]/.test(code[j])) j++;
                tokens.push({ type: 'atrule', value: code.slice(i, j) });
                i = j;
                continue;
            }

            // Selectors, properties, values (simplified)
            if (/[a-zA-Z_#.-]/.test(code[i])) {
                let j = i;
                while (j < code.length && /[a-zA-Z0-9_#.-]/.test(code[j])) j++;
                const word = code.slice(i, j);

                // Look ahead for colon (property) or brace (selector)
                let k = j;
                while (k < code.length && /\s/.test(code[k])) k++;

                if (code[k] === ':' && code[k + 1] !== ':') {
                    tokens.push({ type: 'property', value: word });
                } else if (word.startsWith('#') || word.startsWith('.')) {
                    tokens.push({ type: 'selector', value: word });
                } else {
                    tokens.push({ type: 'value', value: word });
                }
                i = j;
                continue;
            }

            // Punctuation
            if ('{}:;,()'.includes(code[i])) {
                tokens.push({ type: 'punctuation', value: code[i] });
                i++;
                continue;
            }

            tokens.push({ type: 'text', value: code[i] });
            i++;
        }

        return tokens.map(t => {
            const escaped = this.escapeHtml(t.value);
            switch (t.type) {
                case 'comment': return `<span class="hljs-comment">${escaped}</span>`;
                case 'string': return `<span class="hljs-string">${escaped}</span>`;
                case 'number': return `<span class="hljs-number">${escaped}</span>`;
                case 'atrule': return `<span class="hljs-keyword">${escaped}</span>`;
                case 'property': return `<span class="hljs-attribute">${escaped}</span>`;
                case 'selector': return `<span class="hljs-selector-class">${escaped}</span>`;
                case 'value': return `<span class="hljs-literal">${escaped}</span>`;
                case 'punctuation': return `<span class="hljs-punctuation">${escaped}</span>`;
                default: return escaped;
            }
        }).join('');
    }

    // HTML syntax highlighting
    highlightHTML(code) {
        const tokens = [];
        let i = 0;

        while (i < code.length) {
            // Comments
            if (code.slice(i, i + 4) === '<!--') {
                let end = code.indexOf('-->', i + 4);
                if (end === -1) end = code.length;
                else end += 3;
                tokens.push({ type: 'comment', value: code.slice(i, end) });
                i = end;
                continue;
            }

            // DOCTYPE
            if (code.slice(i, i + 9).toLowerCase() === '<!doctype') {
                let end = code.indexOf('>', i);
                if (end === -1) end = code.length;
                else end += 1;
                tokens.push({ type: 'doctype', value: code.slice(i, end) });
                i = end;
                continue;
            }

            // Tags
            if (code[i] === '<') {
                let j = i + 1;
                let isClosing = code[j] === '/';
                if (isClosing) j++;

                // Tag name
                let tagStart = j;
                while (j < code.length && /[a-zA-Z0-9-]/.test(code[j])) j++;
                const tagName = code.slice(tagStart, j);

                if (tagName) {
                    tokens.push({ type: 'punctuation', value: code.slice(i, tagStart) });
                    tokens.push({ type: 'tag', value: tagName });
                    i = j;

                    // Parse attributes until >
                    while (i < code.length && code[i] !== '>') {
                        // Whitespace
                        if (/\s/.test(code[i])) {
                            let ws = '';
                            while (i < code.length && /\s/.test(code[i])) {
                                ws += code[i];
                                i++;
                            }
                            tokens.push({ type: 'text', value: ws });
                            continue;
                        }

                        // Self-closing
                        if (code[i] === '/') {
                            tokens.push({ type: 'punctuation', value: '/' });
                            i++;
                            continue;
                        }

                        // Attribute name
                        if (/[a-zA-Z_:-]/.test(code[i])) {
                            let attrStart = i;
                            while (i < code.length && /[a-zA-Z0-9_:-]/.test(code[i])) i++;
                            tokens.push({ type: 'attr-name', value: code.slice(attrStart, i) });

                            // = and value
                            if (code[i] === '=') {
                                tokens.push({ type: 'punctuation', value: '=' });
                                i++;

                                // Quoted value
                                if (code[i] === '"' || code[i] === "'") {
                                    const quote = code[i];
                                    let valEnd = i + 1;
                                    while (valEnd < code.length && code[valEnd] !== quote) valEnd++;
                                    if (code[valEnd] === quote) valEnd++;
                                    tokens.push({ type: 'attr-value', value: code.slice(i, valEnd) });
                                    i = valEnd;
                                }
                            }
                            continue;
                        }

                        tokens.push({ type: 'text', value: code[i] });
                        i++;
                    }

                    if (code[i] === '>') {
                        tokens.push({ type: 'punctuation', value: '>' });
                        i++;
                    }
                    continue;
                }
            }

            // Text content
            let textEnd = code.indexOf('<', i);
            if (textEnd === -1) textEnd = code.length;
            if (textEnd > i) {
                tokens.push({ type: 'text', value: code.slice(i, textEnd) });
                i = textEnd;
            } else {
                tokens.push({ type: 'text', value: code[i] });
                i++;
            }
        }

        return tokens.map(t => {
            const escaped = this.escapeHtml(t.value);
            switch (t.type) {
                case 'comment': return `<span class="hljs-comment">${escaped}</span>`;
                case 'doctype': return `<span class="hljs-meta">${escaped}</span>`;
                case 'tag': return `<span class="hljs-name">${escaped}</span>`;
                case 'attr-name': return `<span class="hljs-attr">${escaped}</span>`;
                case 'attr-value': return `<span class="hljs-string">${escaped}</span>`;
                case 'punctuation': return `<span class="hljs-punctuation">${escaped}</span>`;
                default: return escaped;
            }
        }).join('');
    }

    // C# syntax highlighting
    highlightCSharp(code) {
        const tokens = [];
        let i = 0;

        const keywords = ['if', 'else', 'switch', 'case', 'default', 'for', 'foreach', 'while', 'do', 'break', 'continue', 'return', 'throw', 'try', 'catch', 'finally', 'new', 'typeof', 'is', 'as', 'sizeof', 'stackalloc', 'checked', 'unchecked', 'lock', 'using', 'yield', 'await', 'async', 'goto', 'in', 'out', 'ref', 'params', 'base', 'this', 'when', 'where', 'select', 'from', 'orderby', 'group', 'by', 'join', 'let', 'ascending', 'descending', 'on', 'equals', 'into'];
        const declarationKeywords = ['class', 'struct', 'interface', 'enum', 'delegate', 'namespace', 'public', 'private', 'protected', 'internal', 'static', 'readonly', 'const', 'volatile', 'virtual', 'override', 'abstract', 'sealed', 'extern', 'unsafe', 'partial', 'get', 'set', 'add', 'remove', 'value', 'var', 'dynamic', 'record', 'init'];
        const typeKeywords = ['void', 'int', 'long', 'short', 'byte', 'sbyte', 'uint', 'ulong', 'ushort', 'float', 'double', 'decimal', 'char', 'bool', 'string', 'object'];
        const valueKeywords = ['null', 'true', 'false', 'default'];
        const operators = ['=>', '??', '?.', '==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '??=', '+', '-', '*', '/', '%', '<', '>', '!', '=', '&', '|', '^', '~', '?', ':', ';', ',', '.', '::'];

        while (i < code.length) {
            // Multi-line comments
            if (code.slice(i, i + 2) === '/*') {
                let end = code.indexOf('*/', i + 2);
                if (end === -1) end = code.length;
                else end += 2;
                tokens.push({ type: 'comment', value: code.slice(i, end) });
                i = end;
                continue;
            }

            // Single-line comments
            if (code.slice(i, i + 2) === '//') {
                let end = code.indexOf('\n', i);
                if (end === -1) end = code.length;
                tokens.push({ type: 'comment', value: code.slice(i, end) });
                i = end;
                continue;
            }

            // XML documentation comments
            if (code.slice(i, i + 3) === '///') {
                let end = code.indexOf('\n', i);
                if (end === -1) end = code.length;
                tokens.push({ type: 'comment', value: code.slice(i, end) });
                i = end;
                continue;
            }

            // Attributes [...]
            if (code[i] === '[') {
                let j = i + 1;
                let depth = 1;
                while (j < code.length && depth > 0) {
                    if (code[j] === '[') depth++;
                    else if (code[j] === ']') depth--;
                    j++;
                }
                tokens.push({ type: 'attribute', value: code.slice(i, j) });
                i = j;
                continue;
            }

            // String literals (verbatim @"..." and interpolated $"...")
            if (code[i] === '@' && code[i + 1] === '"') {
                let j = i + 2;
                while (j < code.length) {
                    if (code[j] === '"') {
                        if (code[j + 1] === '"') {
                            j += 2; // Escaped quote
                        } else {
                            j++;
                            break;
                        }
                    } else {
                        j++;
                    }
                }
                tokens.push({ type: 'string', value: code.slice(i, j) });
                i = j;
                continue;
            }

            // Interpolated strings $"..."
            if (code[i] === '$' && code[i + 1] === '"') {
                let j = i + 2;
                let escaped = false;
                while (j < code.length) {
                    if (escaped) {
                        escaped = false;
                    } else if (code[j] === '\\') {
                        escaped = true;
                    } else if (code[j] === '"') {
                        j++;
                        break;
                    }
                    j++;
                }
                tokens.push({ type: 'string', value: code.slice(i, j) });
                i = j;
                continue;
            }

            // Regular string literals
            if (code[i] === '"') {
                let j = i + 1;
                let escaped = false;
                while (j < code.length) {
                    if (escaped) {
                        escaped = false;
                    } else if (code[j] === '\\') {
                        escaped = true;
                    } else if (code[j] === '"') {
                        j++;
                        break;
                    }
                    j++;
                }
                tokens.push({ type: 'string', value: code.slice(i, j) });
                i = j;
                continue;
            }

            // Character literals
            if (code[i] === "'") {
                let j = i + 1;
                if (code[j] === '\\') j += 2;
                else j++;
                if (code[j] === "'") j++;
                tokens.push({ type: 'string', value: code.slice(i, j) });
                i = j;
                continue;
            }

            // Numbers
            if (/\d/.test(code[i]) || (code[i] === '.' && /\d/.test(code[i + 1]))) {
                let j = i;
                if (code[j] === '0' && (code[j + 1] === 'x' || code[j + 1] === 'X')) {
                    j += 2;
                    while (j < code.length && /[0-9a-fA-F_]/.test(code[j])) j++;
                } else if (code[j] === '0' && (code[j + 1] === 'b' || code[j + 1] === 'B')) {
                    j += 2;
                    while (j < code.length && /[01_]/.test(code[j])) j++;
                } else {
                    while (j < code.length && /[0-9_.]/.test(code[j])) j++;
                    if (code[j] === 'e' || code[j] === 'E') {
                        j++;
                        if (code[j] === '+' || code[j] === '-') j++;
                        while (j < code.length && /[0-9_]/.test(code[j])) j++;
                    }
                }
                // Suffixes: f, d, m, L, UL, etc.
                if (j < code.length && /[fFdDmMlLuU]/.test(code[j])) {
                    j++;
                    if (j < code.length && /[lLuU]/.test(code[j])) j++;
                }
                tokens.push({ type: 'number', value: code.slice(i, j) });
                i = j;
                continue;
            }

            // Identifiers and keywords
            if (/[a-zA-Z_]/.test(code[i])) {
                let j = i;
                while (j < code.length && /[a-zA-Z0-9_]/.test(code[j])) j++;
                const word = code.slice(i, j);

                // Check for generic type parameters <T>
                let isGeneric = false;
                if (code[j] === '<') {
                    const tempJ = j + 1;
                    let depth = 1;
                    let k = tempJ;
                    while (k < code.length && depth > 0) {
                        if (code[k] === '<') depth++;
                        else if (code[k] === '>') depth--;
                        k++;
                    }
                    if (depth === 0) {
                        isGeneric = true;
                    }
                }

                if (keywords.includes(word)) {
                    tokens.push({ type: 'keyword', value: word });
                } else if (declarationKeywords.includes(word)) {
                    tokens.push({ type: 'keyword', value: word });
                } else if (typeKeywords.includes(word)) {
                    tokens.push({ type: 'keyword', value: word });
                } else if (valueKeywords.includes(word)) {
                    tokens.push({ type: 'literal', value: word });
                } else if (/^[A-Z]/.test(word) || isGeneric) {
                    // PascalCase likely indicates a type/class
                    tokens.push({ type: 'class', value: word });
                } else {
                    tokens.push({ type: 'identifier', value: word });
                }
                i = j;
                continue;
            }

            // Operators
            let foundOperator = false;
            for (let op of operators.sort((a, b) => b.length - a.length)) {
                if (code.slice(i, i + op.length) === op) {
                    tokens.push({ type: 'operator', value: op });
                    i += op.length;
                    foundOperator = true;
                    break;
                }
            }
            if (foundOperator) continue;

            // Parentheses and brackets
            if ('(){}[]'.includes(code[i])) {
                tokens.push({ type: 'punctuation', value: code[i] });
                i++;
                continue;
            }

            // Whitespace and other characters
            tokens.push({ type: 'text', value: code[i] });
            i++;
        }

        return tokens.map(t => {
            const escaped = this.escapeHtml(t.value);
            switch (t.type) {
                case 'comment': return `<span class="hljs-comment">${escaped}</span>`;
                case 'keyword': return `<span class="hljs-keyword">${escaped}</span>`;
                case 'string': return `<span class="hljs-string">${escaped}</span>`;
                case 'number': return `<span class="hljs-number">${escaped}</span>`;
                case 'literal': return `<span class="hljs-literal">${escaped}</span>`;
                case 'attribute': return `<span class="hljs-meta">${escaped}</span>`;
                case 'class': return `<span class="hljs-title">${escaped}</span>`;
                case 'operator': return `<span class="hljs-operator">${escaped}</span>`;
                case 'punctuation': return `<span class="hljs-punctuation">${escaped}</span>`;
                default: return escaped;
            }
        }).join('');
    }
}

