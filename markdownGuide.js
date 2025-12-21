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
| Några saker över den här tabellen| Att färglägga kodblock baserat på språk|
| Den här tabellen| Att laga min synkade scroll |
| Men också några saker under den här tabellen | Att umgås med min sambo den här veckan |

## Kodblock

\`\`\`
let anka = [];

if (anka) {
    console.log("Ankan finns.");
}

if (anka == true) {
    console.log("Ankan är sann.");
}

if (anka == false) {
    console.log("Ankan är också falsk.");
}
\`\`\`

## Inlinead kod

Den här webbsidan använder tyvärr inte \`markedjs/marked\`, den hade nog reggat olika markdown-uttryck bättre isåfall!`;
