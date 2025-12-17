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
            case 'LIST_ITEM':
                return this.parseList();
            case 'CODE_BLOCK':
                return this.parseCodeBlock();
            case 'QUOTE':
                return this.parseQuote();
            case 'TABLE':
                return this.parseTable();
            case 'TEXT':
                return this.parseParagraph();
            default:
                this.pos++;
                return null;
        }
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
    render(ast) {
        return this.renderNode(ast);
    }

    renderNode(node) {
        if (!node) return '';

        switch (node.type) {
            case 'document':
                return node.children.map(child => this.renderNode(child)).join('');

            case 'heading':
                const content = this.renderChildren(node.children);
                return `<h${node.level}>${content}</h${node.level}>`;

            case 'paragraph':
                return `<p>${this.renderChildren(node.children)}</p>`;

            case 'bold':
                return `<strong>${this.renderChildren(node.children)}</strong>`;

            case 'italic':
                return `<em>${this.renderChildren(node.children)}</em>`;

            case 'code':
                return `<code>${this.escapeHtml(node.value)}</code>`;

            case 'code_block':
                return `<pre><code>${this.escapeHtml(node.content)}</code></pre>`;

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
}