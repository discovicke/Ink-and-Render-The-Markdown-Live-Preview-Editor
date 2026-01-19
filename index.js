'use strict';

/**
 * =============================================================================
 * MARKDOWN PREVIEW APPLICATION
 * =============================================================================
 * Main entry point for the markdown preview editor application.
 * Imports and orchestrates all modules for a modular, maintainable codebase.
 *
 * @author discovicke
 * @version 2.0.0
 * =============================================================================
 */

// =============================================================================
// IMPORTS
// =============================================================================

// AST Parser and Renderer
import { Parser, Renderer, Tokenizer } from "./AST.js";
import { markdownGuideTemplate } from "./markdownGuide.js";

// Editor modules
import { updateLineNumbers, resizeTextarea } from './js/editor/lineNumbers.js';
import { syncScroll, createScrollFlags } from './js/editor/syncScroll.js';

// Preview modules
import { generateTableOfContents, updateActiveToC, setupToCToggle } from './js/preview/tableOfContents.js';
import { makeHeadingsCollapsible, updateCollapseAllIcon, setupCollapseAllToggle } from './js/preview/collapsible.js';

// Utility modules
import { saveMarkdownText, loadMarkdownText, loadViewMode } from './js/utils/storage.js';
import { updateStatsDisplay } from './js/utils/stats.js';
import { setupCodeCopyButtons } from './js/utils/clipboard.js';

// UI modules
import { updateViewIcons, setupViewSwitch } from './js/ui/viewMode.js';
import { setupResizeHandle } from './js/ui/resizeHandle.js';
import { setupSettingsDropdown, setupThemeSelect, setupFontSelect, setupSyncScrollCheckbox } from './js/ui/settings.js';
import { setupCopyButton, setupClearButton, setupResetButton, setupDownloadButton, updateClearButtonState } from './js/ui/toolbar.js';

// =============================================================================
// DOM ELEMENT REFERENCES
// =============================================================================

const elements = {
    // Editor elements
    inputText: document.querySelector('#input'),
    mirrorHighlight: document.querySelector('#text-highlight'),
    lineNumbers: document.querySelector('#line-numbers'),
    editorArea: document.querySelector('#editor-area'),
    markdown: document.querySelector('#markdown'),

    // Preview elements
    outputText: document.querySelector('#preview-content'),
    previewPane: document.querySelector('#preview-pane'),
    preview: document.querySelector('#preview'),

    // ToC elements
    tocToggle: document.querySelector('#toc-toggle'),
    tocPanel: document.querySelector('#toc-panel'),
    tocClose: document.querySelector('#toc-close'),
    tocContent: document.querySelector('#toc-content'),
    collapseAllToggle: document.querySelector('#collapse-all-toggle'),

    // Toolbar elements
    copyButton: document.querySelector('#copy-markdown-btn'),
    clearButton: document.querySelector('#clear-markdown-btn'),
    resetButton: document.querySelector('#reset-markdown-btn'),
    downloadButton: document.querySelector('#download-markdown-btn'),

    // Stats elements
    wordCountEl: document.querySelector('#word-count'),
    charCountEl: document.querySelector('#char-count'),
    readTimeEl: document.querySelector('#read-time'),

    // Settings elements
    settingsToggle: document.querySelector('#settings-toggle'),
    settingsDropdown: document.querySelector('#settings-dropdown'),
    themeSelect: document.querySelector('#theme-select'),
    fontSelect: document.querySelector('#font-select'),
    syncCheckbox: document.querySelector('#sync-scroll'),

    // View elements
    viewSwitch: document.querySelector('#view-switch'),
    resizeHandle: document.querySelector('#resize-handle')
};

// View buttons
const viewButtons = elements.viewSwitch
    ? Array.from(elements.viewSwitch.querySelectorAll('button[data-view]'))
    : [];

// =============================================================================
// STATE
// =============================================================================

const scrollFlags = createScrollFlags();
let refreshRaf = null;

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Parses markdown text and returns HTML.
 *
 * @param {string} text - The markdown text to parse
 * @returns {string} The rendered HTML
 */
function parseMarkdown(text) {
    if (!text.trim()) return '';

    try {
        const tokenizer = new Tokenizer(text);
        const tokens = tokenizer.tokenize();

        const parser = new Parser(tokens);
        const ast = parser.parse();

        const renderer = new Renderer();
        return renderer.render(ast);

    } catch (error) {
        console.error('Parsing error:', error);
        return '<p>Ett fel uppstod vid parsing</p>';
    }
}

/**
 * Refreshes the editor layout with debouncing.
 */
function refreshLayout() {
    if (refreshRaf) cancelAnimationFrame(refreshRaf);
    refreshRaf = requestAnimationFrame(() => {
        try {
            resizeTextarea(elements.inputText, elements.mirrorHighlight);
            updateLineNumbers(elements.inputText, elements.mirrorHighlight, elements.lineNumbers);
        } finally {
            refreshRaf = null;
        }
    });
}

/**
 * Updates all UI components after content change.
 */
function updateAllUI() {
    updateLineNumbers(elements.inputText, elements.mirrorHighlight, elements.lineNumbers);
    resizeTextarea(elements.inputText, elements.mirrorHighlight);
    elements.outputText.innerHTML = parseMarkdown(elements.inputText.value);
    makeHeadingsCollapsible(elements.outputText, () =>
        updateCollapseAllIcon(elements.outputText, elements.collapseAllToggle)
    );
    saveMarkdownText(elements.inputText.value);
    updateClearButtonState(elements.clearButton, elements.inputText);
    updateStatsDisplay(elements.inputText.value, elements.wordCountEl, elements.charCountEl, elements.readTimeEl);
    generateTableOfContents(elements.outputText, elements.tocContent, elements.tocPanel);
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initializes all UI components and event listeners.
 */
function initializeApp() {
    const defaultView = loadViewMode();

    // Set initial view mode
    document.body.classList.add(`view-${defaultView}`);

    // Setup resize handle and get state
    const resizeState = setupResizeHandle(
        elements.resizeHandle,
        elements.markdown,
        elements.preview,
        refreshLayout
    );

    // Setup view mode switching
    setupViewSwitch(
        elements.viewSwitch,
        elements.markdown,
        elements.preview,
        resizeState.userResized,
        refreshLayout,
        viewButtons
    );

    // Setup settings
    setupSettingsDropdown(elements.settingsToggle, elements.settingsDropdown);
    setupThemeSelect(elements.themeSelect);
    setupFontSelect(elements.fontSelect);
    const isSyncEnabled = setupSyncScrollCheckbox(elements.syncCheckbox);

    // Setup toolbar buttons
    setupCopyButton(elements.copyButton, elements.inputText);
    setupClearButton(
        elements.clearButton,
        elements.inputText,
        elements.outputText,
        elements.mirrorHighlight,
        updateAllUI
    );
    setupResetButton(
        elements.resetButton,
        elements.inputText,
        markdownGuideTemplate,
        parseMarkdown,
        elements.outputText,
        updateAllUI
    );
    setupDownloadButton(elements.downloadButton, elements.inputText);

    // Setup ToC
    setupToCToggle(elements.tocToggle, elements.tocPanel, elements.tocClose);

    // Setup collapsible sections
    setupCollapseAllToggle(elements.collapseAllToggle, elements.outputText);

    // Setup code copy buttons in preview
    setupCodeCopyButtons(elements.previewPane);

    // =============================================================================
    // EVENT LISTENERS
    // =============================================================================

    // Main input handler
    elements.inputText.addEventListener('input', updateAllUI);

    // Scroll sync
    elements.editorArea.addEventListener('scroll', () => {
        syncScroll(
            elements.editorArea,
            elements.previewPane,
            scrollFlags.markdown,
            scrollFlags.preview,
            isSyncEnabled()
        );
    });

    elements.previewPane.addEventListener('scroll', () => {
        syncScroll(
            elements.previewPane,
            elements.editorArea,
            scrollFlags.preview,
            scrollFlags.markdown,
            isSyncEnabled()
        );
        updateActiveToC(elements.outputText, elements.tocContent, elements.previewPane);
    });

    // Tab key handling
    elements.inputText.tabIndex = 0;
    elements.inputText.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            e.stopImmediatePropagation();

            const start = elements.inputText.selectionStart;
            const end = elements.inputText.selectionEnd;
            const value = elements.inputText.value;
            const insert = '    ';

            elements.inputText.value = value.slice(0, start) + insert + value.slice(end);

            const newPos = start + insert.length;
            elements.inputText.selectionStart = newPos;
            elements.inputText.selectionEnd = newPos;

            updateAllUI();
        }
    });

    // Line number updates on click/keyup
    elements.inputText.addEventListener('click', () =>
        updateLineNumbers(elements.inputText, elements.mirrorHighlight, elements.lineNumbers)
    );
    elements.inputText.addEventListener('keyup', () =>
        updateLineNumbers(elements.inputText, elements.mirrorHighlight, elements.lineNumbers)
    );

    // Window resize handler
    window.addEventListener('resize', refreshLayout);

    // =============================================================================
    // INITIAL RENDER
    // =============================================================================

    // Load saved content
    const savedText = loadMarkdownText();
    if (savedText !== null) {
        elements.inputText.value = savedText;
    }

    // Initial UI update
    updateAllUI();
    updateViewIcons(defaultView, viewButtons);
}

// Start the application
initializeApp();
