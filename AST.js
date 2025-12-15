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
        // Tom rad
        if (line.trim() === '') {
            return {type: 'BLANK_LINE'};
        }
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            return {
                type: 'HEADING',
                level: headingMatch[1].length,
                content: headingMatch[2]
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
            children: this.parseInline(lines.join(' '))
        };
    }

    parseInline(text) {
        const nodes = [];
        let current = '';
        let i = 0;

        while (i < text.length) {
            if ((text[i] === '*' && text[i + 1] === '*') ||
                (text[i] === '_' && text[i + 1] === '_')) {
                if (current) {
                    nodes.push({type: 'text', value: current});
                    current = '';
                }

                const char = text[i];
                const boldMatch = text.substring(i).match(
                    char === '*'
                        ? /^\*\*(.+?)\*\*/
                        : /^__(.+?)__/
                );

                if (boldMatch) {
                    nodes.push({
                        type: 'bold',
                        children: this.parseInline(boldMatch[1])
                    });
                    i += boldMatch[0].length;
                    continue;
                }
            }

            if (text[i] === '*' || text[i] === '_') {
                if (current) {
                    nodes.push({type: 'text', value: current});
                    current = '';
                }

                const char = text[i];
                const italicMatch = text.substring(i).match(
                    char === '*'
                        ? /^\*(.+?)\*/
                        : /^_(.+?)_/
                );

                if (italicMatch) {
                    nodes.push({
                        type: 'italic',
                        children: this.parseInline(italicMatch[1])
                    });
                    i += italicMatch[0].length;
                    continue;
                }
            }

            current += text[i];
            i++;
        }

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