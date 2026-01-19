'use strict';

/**
 * =============================================================================
 * TABLE OF CONTENTS MODULE
 * =============================================================================
 * Generates and manages an interactive table of contents from markdown headings.
 * Features smooth scrolling navigation and active section highlighting.
 * =============================================================================
 */

/**
 * Generates a table of contents from headings in the preview content.
 * Creates clickable links with smooth scroll navigation.
 *
 * @param {HTMLElement} outputText - The preview content element
 * @param {HTMLElement} tocContent - The ToC content container
 * @param {HTMLElement} tocPanel - The ToC panel element (for auto-close on mobile)
 */
export function generateTableOfContents(outputText, tocContent, tocPanel) {
    if (!tocContent || !outputText) return;

    // Find all headings in the preview
    const headings = outputText.querySelectorAll('h1, h2, h3, h4, h5, h6');

    if (headings.length === 0) {
        tocContent.innerHTML = '';
        return;
    }

    // Generate unique IDs for headings if they don't have one
    headings.forEach((heading, index) => {
        if (!heading.id) {
            const text = heading.textContent.trim();
            heading.id = `heading-${text.toLowerCase().replace(/[^\w]+/g, '-')}-${index}`;
        }
    });

    // Build the ToC HTML
    const tocItems = Array.from(headings).map((heading) => {
        const level = heading.tagName.toLowerCase();
        const text = heading.textContent.trim();
        const id = heading.id;

        return `<li><a href="#${id}" class="toc-${level}" data-target="${id}">${text}</a></li>`;
    }).join('');

    tocContent.innerHTML = `<ul>${tocItems}</ul>`;

    // Add click handlers for smooth scrolling
    tocContent.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // Smooth scroll to the heading
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Update active state
                tocContent.querySelectorAll('a').forEach(a => a.classList.remove('active'));
                link.classList.add('active');

                // Close ToC on mobile after clicking
                if (window.innerWidth <= 500 && tocPanel) {
                    tocPanel.classList.add('hidden');
                }
            }
        });
    });
}

/**
 * Updates the active ToC item based on current scroll position.
 * Highlights the heading that is currently in view.
 *
 * @param {HTMLElement} outputText - The preview content element
 * @param {HTMLElement} tocContent - The ToC content container
 * @param {HTMLElement} previewPane - The preview pane element
 */
export function updateActiveToC(outputText, tocContent, previewPane) {
    if (!tocContent || !previewPane || !outputText) return;

    const headings = outputText.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) return;

    // Find which heading is currently in view
    const scrollPosition = previewPane.scrollTop + 100; // Offset for better UX

    let activeHeading = null;
    headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        const headingTop = rect.top + previewPane.scrollTop;

        if (headingTop <= scrollPosition) {
            activeHeading = heading;
        }
    });

    // Update active state in ToC
    if (activeHeading) {
        tocContent.querySelectorAll('a').forEach(a => a.classList.remove('active'));
        const activeLink = tocContent.querySelector(`a[data-target="${activeHeading.id}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}

/**
 * Sets up ToC toggle functionality.
 *
 * @param {HTMLElement} tocToggle - The toggle button element
 * @param {HTMLElement} tocPanel - The ToC panel element
 * @param {HTMLElement} tocClose - The close button element
 */
export function setupToCToggle(tocToggle, tocPanel, tocClose) {
    if (tocToggle && tocPanel) {
        tocToggle.addEventListener('click', () => {
            tocPanel.classList.toggle('hidden');
        });
    }

    if (tocClose && tocPanel) {
        tocClose.addEventListener('click', () => {
            tocPanel.classList.add('hidden');
        });
    }

    // Close ToC when clicking outside
    document.addEventListener('click', (e) => {
        if (tocPanel && !tocPanel.classList.contains('hidden')) {
            if (!tocPanel.contains(e.target) && !tocToggle.contains(e.target)) {
                tocPanel.classList.add('hidden');
            }
        }
    });
}
