'use strict'
export const markdownGuideTemplate = `# Det här är h1
## Det här är h2
### Det här är h3
#### Det här är h4
##### Det här är h5
###### Det här är h6

## Textuttryck
Det här är normal text

*Den här texten är kursiv*  
_men den här är också kursiv_

**Den här texten är fetstilt**  
__Den här är också fetstilt__

_Och man kan blanda kursivt och **fetstilt** kursiv_

## Lists
### O-ordnad lista
* Första ankan
* Andra ankan
* Tredje ankan
    * Tredje ankans första barn
    * Tredje ankans andra barn

### Ordnad lista
1. Första ankan
2. Andra ankan
3. Tredje ankan
    1. Tredje ankans första barn
    2. Tredje ankans andra barn

### Checklista
- [x] Automatisk sparning till localStorage
- [x] Länkar och bilder
- [x] Punktlistor med undernivåer
- [x] Nummerlistor med undernivåer
- [x] Tabeller
- [x] Radbrytning
- [x] Citat med flera rader
- [x] Enkla och flerradskodblock
- [x] Fotnoter
- [x] Checklista
- [x] JavaScript, CSS, HTML och C# syntax highlighting

## Bilder
![Det här är en anktext.](/jsAnka.png "Det här är en ledsen anka.")

## Länkar
Har du ett [favoritlag](https://sv.wikipedia.org/wiki/Anaheim_Ducks) i hockey? 

## Blockcitat
>I teorin är jag en vuxen människa.  
>I praktiken är jag som JavaScript.
>>... jag vet inte vad som är fel och istället för att krascha och be om hjälp så misslyckas jag under tystnad!

## Tabeller

| Jag hann med:  | Jag hann inte med: |
|-|:-:|
| Automatisk localStorage-sparning | Att vila |
| Checklistor och fotnoter | Att inte skriva kod |
| JavaScript syntax highlighting | Att sluta förbättra |

## Fotnoter

Markdown är ett fantastiskt format[^1] som gör det enkelt att skriva dokumentation[^2]. 
Fotnoterna samlas automatiskt längst ner i dokumentet[^3]!

[^1]: Det skapades av John Gruber 2004.
[^2]: Speciellt för README-filer på GitHub.

## Kodblock Syntax Highlighting
### JavaScript

\`\`\`js
// En enkel funktion med syntax highlighting
const greet = async (name) => {
    if (name === null || name === undefined) {
        return "Hello, stranger!";
    }
    
    const message = \`Hello, ${name}!\`;
    console.log(message);
    return message;
};

/* Multi-line comment
   with several lines */
function fibonacci(n) {
    let a = 0, b = 1;
    for (let i = 0; i < n; i++) {
        [a, b] = [b, a + b];
    }
    return a;
}

// Regex example
const pattern = /[a-z]+\\d*/gi;
const numbers = [42, 3.14, 0xFF, 1e10];

import { Parser } from './AST.js';
export default greet;
\`\`\`

### CSS

\`\`\`css
/* CSS example with highlighting */
.container {
    display: flex;
    background-color: #1a1a1a;
    padding: 20px;
}

@media (max-width: 768px) {
    .container {
        flex-direction: column;
    }
}
\`\`\`

### HTML

\`\`\`html
<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <title>Min sida</title>
</head>
<body>
    <!-- En kommentar -->
    <div class="container" id="main">
        <p>Hej världen!</p>
    </div>
</body>
</html>
\`\`\`

### C#

\`\`\`csharp
// C# example with syntax highlighting
using System;
using System.Linq;
using System.Collections.Generic;

namespace MyApp
{
    /// <summary>
    /// A simple class demonstrating C# features
    /// </summary>
    [Serializable]
    public class Person
    {
        public string Name { get; set; }
        public int Age { get; private set; }
        
        // Constructor
        public Person(string name, int age)
        {
            Name = name ?? throw new ArgumentNullException(nameof(name));
            Age = age;
        }
        
        // Method with LINQ
        public static async Task<List<Person>> GetAdultsAsync(IEnumerable<Person> people)
        {
            var adults = people
                .Where(p => p.Age >= 18)
                .OrderBy(p => p.Name)
                .ToList();
            
            await Task.Delay(100);
            return adults;
        }
        
        // Override ToString
        public override string ToString() => $"{Name} ({Age})";
    }
    
    class Program
    {
        static void Main(string[] args)
        {
            var person = new Person("Anna", 25);
            Console.WriteLine($"Hello, {person.Name}!");
            
            // Numbers and types
            int count = 42;
            double pi = 3.14159;
            decimal price = 99.99m;
            var hex = 0xFF;
            
            /* Multi-line comment
               demonstrating C# */
            string interpolated = $"Count: {count}";
            string verbatim = @"C:\\Users\\Name";
        }
    }
}
\`\`\`

## Inlinead kod

Den här webbsidan har nu stöd för \`syntax highlighting\` i kodblock!

[^3]: Observera att fotnotsdefinitionerna kan skrivas var som helst i dokumentet, men de renderas alltid längst ner.`;
