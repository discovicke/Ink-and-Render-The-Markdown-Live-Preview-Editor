'use strict'

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
        // EMPTY LINE
        if (line.trim() === '') {
            return {type: 'BLANK_LINE'};
        }
        // HEADING
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            return {
                type: 'HEADING',
                level: headingMatch[1].length,
                content: headingMatch[2]
            };
        }
        // QUOTE
        const quoteMatch = line.match(/^>\s*(.*)$/);
        if (quoteMatch) {
            return {
                type: 'QUOTE',
                content: quoteMatch[1]
            };
        }
        return {
            type: 'TEXT',
            content: line
        };
    }
}

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
            case 'QUOTE':
                return this.parseQuote();
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

    parseQuote() {
        const lines = [];

        while (this.pos < this.tokens.length) {
            const token = this.tokens[this.pos];

            if (token.type !== 'QUOTE') {
                break;
            }

            lines.push(token.content);
            this.pos++;
        }

        return {
            type: 'blockquote',
            children: this.parseInline(lines.join(' '))
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

        return {
            type: 'paragraph',
            children: this.parseInline(lines.join('\n'))
        };
    }

    getInlineRules() {
        return [
            // NEW LINE
            {
                type: 'line_break',
                pattern: /^  \n/,
                handler: (match) => ({
                    type: 'line_break'
                })
            },

            // BOLD
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
            // ITALIC
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
            },
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
                        nodes.push({type: 'text', value: current});
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
            nodes.push({type: 'text', value: current});
        }

        return nodes;
    }
}

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

            case 'blockquote':
                return `<blockquote>${this.renderChildren(node.children)}</blockquote>`;

            case 'text':
                return this.escapeHtml(node.value);

            case 'line_break':
                return '<br>';

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