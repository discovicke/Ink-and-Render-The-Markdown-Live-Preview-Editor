[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/YSSRrL--)
# .NET25: Markdown Preview

En webbsida som låter oss skriva Markdown och se resultatet i realtid.

## Hur allt fungerar

Innan utveckling påbörjas ska **node** och **npm** installeras, och följande
kommand ska köras:

```bash
npm install
```

För att köra testerna ska följande kommand köras:

```bash
npm test
```

Uppladdning via commits och push fungerar som det brukar!

## Begränsningar

- Inga bibliotek eller tredjepartskod får användas, all HTML, CSS och JavaScript
  ska skrivas för hand

- Inga externa resurser användas, ska exempelvis en speciell font användas ska
  denna ligga lokalt bredvid .html filen

- Förhandsgranskningen till höger ska uppdateras i realtid, inte på onchange
  eller motsvarande event som sker först när alla ändringar är klara

## Godkänt

För att bli godkänd ska alla **G** tester vara gröna, och ska uppfyllas så att
alla delar faktiskt används på sidan. Ett tomt element bara så att det finns
räknas inte! Utöver detta gäller följande, vilket det inte finns tester för:

- Själva webbsidan ska **inte** ha någon scrollbar, oavsett hur mycket eller
  litet innehåll som finns. Men de två sektionerna (markdown och preview) ska ha
  **individuella** scrollbars, och dessa ska endast visas om deras innehåll inte
  får plats. Testa att skriva mycket text i
  [Markdown Live Preview](https://markdownlivepreview.com/) och se hur det ser
  ut där för exempel!

- Följande Markdown-syntax ska fungera i förhandsgranskningen:
  - [Titlar](https://www.markdownguide.org/basic-syntax/#headings)
  - [Vanlig text](https://www.markdownguide.org/basic-syntax/#paragraphs-1)
  - [Fetstilt text](https://www.markdownguide.org/basic-syntax/#bold) (både `**`
    och `__`)
  - [Kursiv text](https://www.markdownguide.org/basic-syntax/#italic) (både `*`
    och `_`)

## Väl Godkänt

Alla **VG** tester ska vara gröna, och utöver det ska sidan:

- Ha ett automatiskt mörkt tema baserat på webbläsarinställningar

- Fungera på både mobila enheter liksom vanliga datorer, dvs alla olika
  skärmstorlekar ska fungera inom en rimlig marginal utan att webbsidan går
  sönder (till skillnad från
  [Markdown Live Preview](https://markdownlivepreview.com/), testa den i
  mobilläge för exempel på hur det inte ska se ut!).

  Hur detta ordnas är valfritt, fördelning uppe / nere i stället för vänster /
  höger när skärmen når en viss storlek, en knapp för att byta mellan markdown
  och förhandsgranskningsläge eller två tabbar man kan växla mellan. Gör det
  helt enkelt så snyggt och smidigt som möjligt, men **kom ihåg att dessa
  lösningar endast ska gälla om skärmen är liten nog att kräva det**!

- Minst **fyra** av de följande punkterna ska implementeras:
  - Automatisk sparning och laddning av den skrivna markdown-texten till
    [localstorage](https://www.w3schools.com/jsref/prop_win_localstorage.asp) så
    att man kan återuppta redigering efter att sidan stängts och öppnats igen
  - [Länkar](https://www.markdownguide.org/basic-syntax/#links)
  - [Bilder](https://www.markdownguide.org/basic-syntax/#images)
  - [Punktlistor](https://www.markdownguide.org/basic-syntax/#unordered-lists)
    inklusive undernivåer
  - [Nummerlistor](https://www.markdownguide.org/basic-syntax/#ordered-lists)
    inklusive undernivåer
  - [Tabeller](https://www.markdownguide.org/extended-syntax/#tables)
  - [Radbrytning](https://www.markdownguide.org/basic-syntax/#line-breaks)
  - [Citat](https://www.markdownguide.org/basic-syntax/#blockquotes-1) med stöd
    för
    [flera rader](https://www.markdownguide.org/basic-syntax/#blockquotes-with-multiple-paragraphs)
    och
    [element](https://www.markdownguide.org/basic-syntax/#blockquotes-with-other-elements)
  - [Enkla kodblock](https://www.markdownguide.org/basic-syntax/#code)
  - [Flerradskodblock](https://www.markdownguide.org/extended-syntax/#fenced-code-blocks)
  - [Fotnoter](https://www.markdownguide.org/extended-syntax/#footnotes)
  - [Checklista](https://www.markdownguide.org/extended-syntax/#task-lists)
  - Färgsatt syntax för själva markdown-texten, där titlar, listor, länkar,
    citat och kodblock blir markerade med egna färger. Utöver det ska fetstilt
    text bli fetstilt, och kursiv ska bli kursiv. Se
    [Markdown Live Preview](https://markdownlivepreview.com/) för referenser

- **Extremt stora skrytpoäng**: Ignorera de fyra obligatoriska punkterna ovan,
  och gör minst **en** av av de följande i stället:
  - Fungerande
    [flerradskodblock med färg](https://www.markdownguide.org/extended-syntax/#syntax-highlighting)
    för Javascript, exempelvis såhär:
    ```js
    import * as FS from "fs";
    import {
      BLUE,
      DIM,
      GREEN,
      HIGHLIGHT,
      RED,
      RESET,
      YELLOW,
    } from "./colors.js";

    const hasHtmlTag = /<\s*html(\s+lang\s*=\s*"?\w*"?)?>/;
    const hasHeadTag = /<\s*head\s*>/;
    const hasBodyTag = /<\s*body\s*>/;

    function test(arg1, arg2) {
      const a = arg1 + arg2;
      if (a > 5) return false;
      switch (a) {
        case 1:
          return 7;
        default:
          console.log("test");
          break;
      }
      return {
        "abc": [
          7,
          "true",
          `A template string`,
          { a: "a", b: "b" },
        ],
        0: 1,
        mablop: true,
      };
    }
    ```
    Det är alltså stöd för Javascript (via `` ```js ``) som ska läggas till, där
    koden färgas enligt vanliga VS Code färger. Följande delar av koden bör
    alltså färgas:
    - Kommentarer (`//` och `/**/`)
    - Nyckelord som `if`, `else`, `switch`, `return`, `for` osv
    - Nyckelord som `import`, `as`, `from`
    - Nyckelord för värden som `null`, `undefined`, `true`, `false`
    - Nyckelord för deklarationer som `function`, `let`, `var` och `const`
    - Strängliteraler för `"`, `'` och `` ` `` (det är ok att tolka template
      literaler som en enda stor sträng och färga `${}` innehållet som en sträng
      med)
    - Nummerliteraler som `42` eller `0.5`
    - Regexuttryck som `/abc.*/g`
    - Operatorer som `+`, `=>`, `;` osv
    - Parenteserna `()`, `[]`, `{}`
    - Funktionsnamnet för en deklaration (namnet efter `function`)
    - Funktionsnamnet för ett anrop (namnet innan `(`)

  - Motsvarande för CSS

  - Motsvarande för HTML

- **VG hall of fame**: Gör allt 🥂
