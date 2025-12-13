import { JSDOM } from "jsdom";
import * as FS from "fs";
import * as CSS from "css";
import { RESET, HIGHLIGHT, DIM, RED, GREEN, YELLOW, BLUE } from "./colors.js";

export const SUBLINE = "\n       ";

export const matchCSS = {
    padding: /padding(-(left|right|bottom|top))/,
    margin: /margin(-(left|right|bottom|top))/,
    pixels: /-?\d+px/,
    em: /-?\d+(em|rem)/,
    pixelsOrCalc: /(\d+\w+|(\w+\(.*\)))/,
    var: /((\w+\(.*\)))/,
    notZero: /^(?!-?0(?:[a-zA-Z%]+)?).+/,
    notZeroOrNegative: /^(?!-)(?!0+(?:[a-zA-Z%]+)?$)(?!0$).+/,
};

/** @type DOMWindow */ export let window = null;
/** @type Document */ export let document = null;
/** @type HTMLElement */ export let body = null;

export const head = {
    /** @type HTMLElement[]*/ css: [],
    /** @type HTMLElement[]*/ charset: [],
    /** @type HTMLElement[]*/ viewport: [],
};


export async function loadHtmlAsync(path) {
    const htmlFile = await JSDOM.fromFile(path, {
        resources: "usable",
        runScripts: "dangerously",
    });

    window = htmlFile.window;
    document = window.document;
    body = document.body;

    head.css = querySelectorAll('head link[rel=stylesheet]');
    head.charset = querySelectorAll('head [charset]');
    head.viewport = querySelectorAll('head [name=viewport]');
}

/** @returns {HTMLElement[]} elements */
export function querySelectorAll(query) {
    const raw = document.querySelectorAll(query);
    const output = [];
    raw.forEach(item => output.push(item));
    return output;
}

export function loadCSS(path, testError) {
    const allRules = [];
    const output = {
        error: null,
        path: path,
        rules: [],
        media: [],
        query(query) {
            return allRules
                .map(rule => {
                    const filteredDeclarations = {};
                    let hasMatch = false;
                    for (const declaration of rule.declarations) {
                        if (declaration.type == "comment") continue;

                        let match = false;

                        if (query.property) {
                            match = query.property instanceof RegExp
                                ? query.property.test(declaration.property)
                                : declaration.property == query.property;
                        }
                        if (query.value && (!query.property || match)) {
                            match = query.value instanceof RegExp
                                ? query.value.test(declaration.value)
                                : query.value[0] == "#"
                                    ? declaration.value.toUpperCase() == query.value.toUpperCase()
                                    : declaration.value == query.value;
                        }

                        if (match) {
                            hasMatch = true;
                            filteredDeclarations[declaration.property] = declaration.value;
                        }
                    }
                    return hasMatch ? {
                        selectors: rule.selectors,
                        declarations: filteredDeclarations,
                    } : undefined;
                })
                .filter(x => x);
        },
        count(query) {
            const result = output.query(query);
            return result.reduce((sum, rule) => sum + Object.keys(rule.declarations).length, 0);
        },
        validateCount(settings) {
            const actual = output.count({
                property: settings.property,
                value: settings.value,
            });
            if (actual < settings.min) {
                let error = `${HIGHLIGHT}${settings.name}${RESET} ska användas minst ${GREEN}${settings.min}${RESET} ${settings.min == 1 ? "gång" : "gånger"}`;
                if (actual > 0) error += `, men användes ${RED}${actual}${RESET} ${actual == 1 ? "gång" : "gånger"}`;
                testError(error);
            }
        },
        validateColor(color, name) {
            if (output.count({
                property: /^(color|background(-color)?|border-color|outline-color|(--\S+))$/,
                value: color,
            }) > 0) return;

            if (output.count({
                property: /^(border|outline)$/,
                value: new RegExp(color, "i"),
            }) > 0) return;

            testError(`${name} (${GREEN}${color}${RESET}) ska användas för minst ${GREEN}1${RESET} ${HIGHLIGHT}färg${RESET} ${DIM}(background, color, border, outline)${RESET}`);
        }
    };

    if (!FS.existsSync(path)) {
        output.error = `Filen ${BLUE}${path}${RESET} finns inte`;
        return output;
    }
    const file = FS.readFileSync(path, { encoding: "utf-8" });
    let css;
    try {
        css = CSS.parse(file, {
            source: "styles.css",
            silent: false,
        });
    }
    catch (error) {
        output.error = `Filen innehåller följande fel:${SUBLINE}${RED}${error}${RESET}`;
        return output;
    }

    // Ladda över
    for (let stylesheet of css.stylesheet.rules) {
        if (stylesheet.type == "comment") continue;

        if (stylesheet.type == "rule") {
            const copy = copyStylesheet(stylesheet);
            output.rules.push(copy);
            allRules.push(copy);
        }
        else if (stylesheet.type == "media") {
            const copy = copyMediaQuery(stylesheet);
            output.media.push(copy);
            allRules.push(...copy.rules);
        }
        else if (stylesheet.type == "keyframes") {
            for (const keyframe of stylesheet.keyframes) {
                const copy = copyStylesheet(keyframe);
                output.rules.push(copy);
                allRules.push(copy);
            }
        }
        else {
            console.log(`Oväntad regeltyp i CSS, kontakta gärna Oscar och inkludera detta:\n  ${stylesheet.type}`, Object.keys(stylesheet));
        }
    };
    return output;
}

function copyStylesheet(stylesheet) {
    let filtered = stylesheet.declarations?.filter(x => x.type != "comment") ?? [];
    const unique = {};
    for (const e of filtered) {
        unique[e.property] = e;
    }
    filtered = Object.keys(unique).map(x => unique[x]);

    return {
        ...stylesheet,
        declarations: filtered,
        empty: filtered.length == 0,
    };
}

function copyMediaQuery(query) {
    const filtered = query.rules.map(x => copyStylesheet(x));
    return {
        ...query,
        rules: filtered,
        empty: filtered.length == 0 || filtered.filter(x => x.empty).length == filtered.length,
    };
}