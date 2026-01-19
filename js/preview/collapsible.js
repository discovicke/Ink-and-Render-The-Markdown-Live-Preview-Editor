'use strict';

/**
 * =============================================================================
 * COLLAPSIBLE SECTIONS MODULE
 * =============================================================================
 * Makes headings in the preview collapsible, allowing users to hide/show
 * content sections. Improves navigation in long documents.
 * =============================================================================
 */

/**
 * Makes all headings in the preview collapsible.
 * Wraps headings and their content in collapsible sections.
 * Preserves collapsed state when content is re-rendered.
 *
 * @param {HTMLElement} outputText - The preview content element
 * @param {Function} onToggle - Callback function called when any section is toggled
 */
export function makeHeadingsCollapsible(outputText, onToggle) {
    if (!outputText) return;

    const headings = outputText.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) return;

    // Preserve previously collapsed state
    const collapsedSections = new Set();
    outputText.querySelectorAll('.collapsible-section.collapsed').forEach(section => {
        const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
        if (heading) {
            const headingText = heading.textContent.trim();
            collapsedSections.add(headingText);
        }
    });

    headings.forEach((heading) => {
        // Skip if already wrapped
        if (heading.classList.contains('collapsible-heading')) return;

        const level = parseInt(heading.tagName.substring(1));
        const headingText = heading.textContent.trim();

        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'collapsible-section';
        wrapper.setAttribute('data-level', level);

        // Restore collapsed state if it was previously collapsed
        if (collapsedSections.has(headingText)) {
            wrapper.classList.add('collapsed');
        }

        // Insert wrapper before heading
        heading.parentNode.insertBefore(wrapper, heading);

        // Add collapsible class to heading
        heading.classList.add('collapsible-heading');

        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'collapse-toggle';
        toggleBtn.type = 'button';
        toggleBtn.setAttribute('aria-label', 'Toggle section');
        toggleBtn.innerHTML = `
            <svg class="collapse-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                <path d="M7 10l5 5 5-5z" fill="currentColor"/>
            </svg>
        `;

        // Wrap heading content
        const headingContent = document.createElement('span');
        headingContent.className = 'heading-content';
        headingContent.innerHTML = heading.innerHTML;
        heading.innerHTML = '';
        heading.appendChild(toggleBtn);
        heading.appendChild(headingContent);

        // Move heading into wrapper
        wrapper.appendChild(heading);

        // Create collapsible content container
        const contentDiv = document.createElement('div');
        contentDiv.className = 'collapsible-content';

        // Collect content until next heading of same or higher level
        let nextElement = wrapper.nextElementSibling;
        while (nextElement) {
            if (nextElement.matches('h1, h2, h3, h4, h5, h6')) {
                const nextLevel = parseInt(nextElement.tagName.substring(1));
                if (nextLevel <= level) break;
            }

            const elementToMove = nextElement;
            nextElement = nextElement.nextElementSibling;
            contentDiv.appendChild(elementToMove);
        }

        wrapper.appendChild(contentDiv);

        // Add click handler
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            wrapper.classList.toggle('collapsed');
            if (onToggle) onToggle();
        });

        // Make heading clickable too
        heading.addEventListener('click', (e) => {
            if (e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
                wrapper.classList.toggle('collapsed');
                if (onToggle) onToggle();
            }
        });
    });

    // Trigger callback after initial setup
    if (onToggle) onToggle();
}

/**
 * Updates the collapse-all button icon based on current section states.
 *
 * @param {HTMLElement} outputText - The preview content element
 * @param {HTMLElement} collapseAllToggle - The collapse-all button element
 */
export function updateCollapseAllIcon(outputText, collapseAllToggle) {
    if (!collapseAllToggle || !outputText) return;

    const sections = outputText.querySelectorAll('.collapsible-section');
    if (sections.length === 0) return;

    const allCollapsed = Array.from(sections).every(section =>
        section.classList.contains('collapsed')
    );

    const collapseIcon = collapseAllToggle.querySelector('.collapse-icon');
    const expandIcon = collapseAllToggle.querySelector('.expand-icon');

    if (allCollapsed) {
        // Show expand icon (arrows pointing outward)
        if (collapseIcon) collapseIcon.classList.add('hidden');
        if (expandIcon) expandIcon.classList.remove('hidden');
        collapseAllToggle.title = 'Expand All Sections';
    } else {
        // Show collapse icon (arrows pointing inward)
        if (collapseIcon) collapseIcon.classList.remove('hidden');
        if (expandIcon) expandIcon.classList.add('hidden');
        collapseAllToggle.title = 'Collapse All Sections';
    }
}

/**
 * Toggles all collapsible sections at once.
 * If all are collapsed, expands all. Otherwise, collapses all.
 *
 * @param {HTMLElement} outputText - The preview content element
 * @param {HTMLElement} collapseAllToggle - The collapse-all button element
 */
export function toggleAllSections(outputText, collapseAllToggle) {
    if (!outputText) return;

    const sections = outputText.querySelectorAll('.collapsible-section');
    if (sections.length === 0) return;

    // Check if all are collapsed
    const allCollapsed = Array.from(sections).every(section =>
        section.classList.contains('collapsed')
    );

    // Toggle all sections
    sections.forEach(section => {
        if (allCollapsed) {
            section.classList.remove('collapsed');
        } else {
            section.classList.add('collapsed');
        }
    });

    // Update icon
    updateCollapseAllIcon(outputText, collapseAllToggle);
}

/**
 * Sets up the collapse-all button functionality.
 *
 * @param {HTMLElement} collapseAllToggle - The collapse-all button element
 * @param {HTMLElement} outputText - The preview content element
 */
export function setupCollapseAllToggle(collapseAllToggle, outputText) {
    if (!collapseAllToggle) return;

    collapseAllToggle.addEventListener('click', () => {
        toggleAllSections(outputText, collapseAllToggle);
    });
}
