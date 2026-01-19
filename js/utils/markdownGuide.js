'use strict'

// =============================================================================
// MARKDOWN GUIDE TEMPLATE (EN)
// =============================================================================
// This template is loaded when the user clicks "RESET".
// It demonstrates both Markdown syntax support and the editor's UI features.
// =============================================================================

export const markdownGuideTemplate = `# Markdown Editor Guide

Welcome! This document is intentionally long so you can test:
- **Scroll sync** (Editor ↔ Preview)
- **Collapsible sections** (click headings or the chevron)
- **Collapse/Expand all** (top-right button)
- **Table of Contents (ToC)** (top-right menu button)
- **Word/Character counter** and estimated read time

---

## UI Features (not Markdown syntax)

### View modes
Use the icons in the header to switch between:
- Markdown-only
- Split view
- Preview-only

### Themes & fonts
Open **Settings** (top-right) to change:
- Theme (Analog Switch, Nordic, Retro Terminal, Hazy Orange, Maroon, Fintech)
- Preview font

### Local storage
Your text is **saved automatically**. Refresh the page and your document should still be here.

### Clipboard / Download
Try the toolbar buttons:
- **COPY** copies raw markdown
- **DOWNLOAD** saves it as \`document.md\`

---

## Headings
# This is H1
## This is H2
### This is H3
#### This is H4
##### This is H5
###### This is H6

> Tip: Use the ToC button to jump between headings.

---

## Text formatting
Normal text.

*Italic with asterisks*  
_Italic with underscores_

**Bold with asterisks**  
__Bold with underscores__

You can mix styles: _italic and **bold** in the same sentence_.

Inline code: \`const x = 42;\`

---

## Links
Here is a link: [Markdown Guide](https://www.markdownguide.org/)

---

## Images
![A sad duck.](/jsAnka.png "A sad duck")

---

## Blockquotes (with nesting)
> In theory, I'm an adult.
> In practice, I'm like JavaScript.
>> ...I don't always crash. Sometimes I fail silently.

---

## Lists

### Unordered list (with nesting)
- First item
- Second item
- Third item
  - Child item A
  - Child item B

### Ordered list (with nesting)
1. First item
2. Second item
3. Third item
   1. Child item 3.1
   2. Child item 3.2

### Task list / checklist
- [x] Auto-save to localStorage
- [x] Live preview
- [x] Nested lists
- [x] Tables
- [x] Footnotes
- [x] ToC
- [x] Collapsible sections
- [x] Multi-language code highlighting (JS, CSS, HTML, C#)
- [ ] Take a coffee break

---

## Tables

| Implemented | Notes |
|---|---|
| Live preview | Updates on every keystroke |
| Sync scroll | Optional toggle in Settings |
| ToC | Built from headings |
| Collapsible sections | Click headings to fold content |

---

## Footnotes
Markdown is great for documentation[^md].
Footnotes are collected at the bottom automatically[^fn].

[^md]: Created by John Gruber in 2004.
[^fn]: Footnote definitions can be placed anywhere in the document.

---

## Fenced code blocks (Syntax Highlighting)

### JavaScript

\`\`\`js
// A small demo with keywords, strings, numbers and regex
export function greet(name) {
  if (name === null || name === undefined) {
    return "Hello, stranger!";
  }

  const message = \`Hello, \${name}!\`;
  console.log(message);
  return message;
}

const pattern = /[a-z]+\\d*/gi;
const numbers = [42, 3.14, 0xFF, 1e10];
\`\`\`

### CSS

\`\`\`css
/* Simple CSS */
.container {
  display: flex;
  padding: 16px;
  border: 1px solid #ccc;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
}
\`\`\`

### HTML

\`\`\`html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Demo</title>
  </head>
  <body>
    <!-- Comment -->
    <div class="container" id="main">
      <p>Hello world!</p>
    </div>
  </body>
</html>
\`\`\`

### C#

\`\`\`csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Demo
{
    public class Person
    {
        public string Name { get; }
        public int Age { get; }

        public Person(string name, int age)
        {
            Name = name ?? throw new ArgumentNullException(nameof(name));
            Age = age;
        }

        public override string ToString() => $"{Name} ({Age})";
    }

    public static class Program
    {
        public static async Task Main()
        {
            var people = new List<Person>
            {
                new("Alex", 17),
                new("Sam", 25),
                new("Taylor", 32)
            };

            var adults = people
                .Where(p => p.Age >= 18)
                .OrderBy(p => p.Name)
                .ToList();

            await Task.Delay(100);
            Console.WriteLine(string.Join(", ", adults));
        }
    }
}
\`\`\`

---

## End
If you can read this, you're at the bottom.
Try scroll syncing from bottom to top.`;
