'use strict';

/**
 * =============================================================================
 * SETTINGS MODULE
 * =============================================================================
 * Manages the settings dropdown panel including theme selection,
 * font selection, and sync scroll toggle.
 * =============================================================================
 */

import { saveTheme, saveFont, saveSyncScroll, loadTheme, loadFont, loadSyncScroll } from '../utils/storage.js';

/**
 * Sets up the settings dropdown toggle functionality.
 * Positions the dropdown relative to the toggle button.
 *
 * @param {HTMLElement} settingsToggle - The settings toggle button
 * @param {HTMLElement} settingsDropdown - The settings dropdown panel
 */
export function setupSettingsDropdown(settingsToggle, settingsDropdown) {
    if (!settingsToggle || !settingsDropdown) return;

    // Move dropdown to body for proper positioning
    document.body.appendChild(settingsDropdown);
    settingsDropdown.style.position = 'absolute';
    settingsDropdown.style.minWidth = '200px';

    const positionDropdown = () => {
        const btnRect = settingsToggle.getBoundingClientRect();
        const top = window.scrollY + btnRect.bottom + 8;
        const right = window.innerWidth - (window.scrollX + btnRect.right);
        settingsDropdown.style.top = `${top}px`;
        settingsDropdown.style.right = `${right}px`;
    };

    // Toggle dropdown on click
    settingsToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsDropdown.classList.toggle('hidden');
        if (!settingsDropdown.classList.contains('hidden')) {
            positionDropdown();
        }
    });

    // Reposition on window resize/scroll
    window.addEventListener('resize', () => {
        if (!settingsDropdown.classList.contains('hidden')) positionDropdown();
    });
    window.addEventListener('scroll', () => {
        if (!settingsDropdown.classList.contains('hidden')) positionDropdown();
    }, true);

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (settingsDropdown.classList.contains('hidden')) return;
        if (!settingsDropdown.contains(e.target) && e.target !== settingsToggle) {
            settingsDropdown.classList.add('hidden');
        }
    });
}

/**
 * Sets up theme selection functionality.
 *
 * @param {HTMLSelectElement} themeSelect - The theme select element
 */
export function setupThemeSelect(themeSelect) {
    if (!themeSelect) return;

    // Load saved theme
    const savedTheme = loadTheme();
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeSelect.value = savedTheme;
    }

    // Handle theme changes
    themeSelect.addEventListener('change', (e) => {
        const value = e.target.value;

        if (value) {
            document.documentElement.setAttribute('data-theme', value);
            saveTheme(value);
        } else {
            document.documentElement.removeAttribute('data-theme');
            saveTheme('');
        }
    });
}

/**
 * Sets up font selection functionality.
 *
 * @param {HTMLSelectElement} fontSelect - The font select element
 */
export function setupFontSelect(fontSelect) {
    if (!fontSelect) return;

    // Load saved font
    const savedFont = loadFont();
    document.documentElement.style.setProperty('--preview-font-family', savedFont);
    fontSelect.value = savedFont;

    // Handle font changes
    fontSelect.addEventListener('change', (e) => {
        const value = e.target.value || 'inherit';
        document.documentElement.style.setProperty('--preview-font-family', value);
        saveFont(value);
    });
}

/**
 * Sets up sync scroll checkbox functionality.
 *
 * @param {HTMLInputElement} syncCheckbox - The sync scroll checkbox
 * @returns {Function} Getter function that returns current sync state
 */
export function setupSyncScrollCheckbox(syncCheckbox) {
    if (!syncCheckbox) return () => true;

    // Load saved preference
    const savedSyncScroll = loadSyncScroll();
    if (savedSyncScroll !== null) {
        syncCheckbox.checked = savedSyncScroll;
    }

    // Handle changes
    syncCheckbox.addEventListener('change', () => {
        saveSyncScroll(syncCheckbox.checked);
    });

    // Return getter for current state
    return () => syncCheckbox.checked;
}
