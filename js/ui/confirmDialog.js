'use strict';

/**
 * =============================================================================
 * CONFIRM DIALOG MODULE
 * =============================================================================
 * A reusable custom confirm dialog that replaces window.confirm() with a
 * styled modal. Returns a Promise<boolean> so it can be awaited.
 *
 * =============================================================================
 */

/**
 * Shows a styled confirmation dialog.
 *
 * @param {object} options
 * @param {string} options.title - Dialog title
 * @param {string} options.message - Dialog body text
 * @param {string} [options.confirmText='Confirm'] - Label for the confirm button
 * @param {string} [options.cancelText='Cancel'] - Label for the cancel button
 * @param {'danger'|'warning'|'info'} [options.variant='warning'] - Visual style
 * @returns {Promise<boolean>} Resolves true if confirmed, false if cancelled
 */
export function confirmDialog({
    title = 'Are you sure?',
    message = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'warning',
} = {}) {
    return new Promise((resolve) => {
        // Backdrop
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';

        // Dialog box
        const dialog = document.createElement('div');
        dialog.className = `confirm-dialog confirm-${variant}`;
        dialog.setAttribute('role', 'alertdialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'confirm-title');
        dialog.setAttribute('aria-describedby', 'confirm-message');

        // Icon per variant
        const iconSvg = {
            danger: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
            warning: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
            info: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
        };

        dialog.innerHTML = `
            <div class="confirm-header">
                <span class="confirm-icon">${iconSvg[variant] || iconSvg.warning}</span>
                <h3 id="confirm-title" class="confirm-title">${title}</h3>
            </div>
            <p id="confirm-message" class="confirm-message">${message}</p>
            <div class="confirm-actions">
                <button type="button" class="confirm-btn-cancel">${cancelText}</button>
                <button type="button" class="confirm-btn-confirm confirm-btn-${variant}">${confirmText}</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Focus the cancel button by default (safer)
        const cancelBtn = dialog.querySelector('.confirm-btn-cancel');
        const confirmBtn = dialog.querySelector('.confirm-btn-confirm');
        cancelBtn.focus();

        // Animate in
        requestAnimationFrame(() => {
            overlay.classList.add('confirm-visible');
        });

        function close(result) {
            overlay.classList.remove('confirm-visible');
            overlay.addEventListener('transitionend', () => {
                overlay.remove();
            }, { once: true });
            // Fallback if transition doesn't fire
            setTimeout(() => {
                if (overlay.parentNode) overlay.remove();
            }, 300);
            resolve(result);
        }

        confirmBtn.addEventListener('click', () => close(true));
        cancelBtn.addEventListener('click', () => close(false));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(false);
        });

        // Keyboard: Escape to cancel, Enter on focused confirm to confirm
        dialog.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                close(false);
            }
            // Trap focus within dialog
            if (e.key === 'Tab') {
                const focusable = [cancelBtn, confirmBtn];
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });
    });
}

