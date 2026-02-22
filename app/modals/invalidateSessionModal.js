/**
 * Invalidate Session Modal - Force logout other users
 */

const API_URL = process.env.API_URL;

// ============================================================================
// TEMPLATE
// ============================================================================

function getInvalidateSessionModalTemplate() {
    return `
        <div class="modal-overlay" id="invalidate-session-modal" style="display: flex; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); justify-content: center; align-items: center;">
            <div class="modal-content" style="max-width: 500px; background: white; border-radius: 8px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4); max-height: 90vh; overflow-y: auto; position: relative; z-index: 10001;">
                <div class="modal-header">
                    <h2 style="margin: 0; color: #2d3748; display: flex; align-items: center; gap: 8px;">
                        <span>🔓</span>
                        <span>Force Logout User</span>
                    </h2>
                    <button class="modal-close" id="invalidate-session-modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="background: #fff3cd; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
                        <p style="color: #92400e; font-size: 13px; margin: 0;">
                            <strong>⚠️ Warning:</strong> This will force logout the specified user from all their active sessions. They will need to login again.
                        </p>
                    </div>

                    <form id="invalidate-session-form">
                        <div class="form-group">
                            <label style="font-size: 14px; font-weight: 600; color: #2d3748; margin-bottom: 8px; display: block;">
                                Username <span style="color: #e53e3e;">*</span>
                            </label>
                            <input 
                                type="text" 
                                id="invalidate-username" 
                                class="ant-input" 
                                placeholder="Enter username to force logout"
                                required
                                style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 14px;"
                            >
                            <p style="color: #718096; font-size: 12px; margin-top: 6px; margin-bottom: 0;">
                                Enter the exact username of the user you want to force logout.
                            </p>
                        </div>

                        <div style="display: flex; gap: 12px; margin-top: 24px;">
                            <button 
                                type="button" 
                                id="cancel-invalidate-btn"
                                style="flex: 1; padding: 10px; background: #e2e8f0; color: #4a5568; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s;"
                                onmouseover="this.style.background='#cbd5e0'"
                                onmouseout="this.style.background='#e2e8f0'"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                id="submit-invalidate-btn"
                                style="flex: 1; padding: 10px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3); transition: all 0.2s;"
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(245, 158, 11, 0.4)'"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(245, 158, 11, 0.3)'"
                            >
                                Force Logout
                            </button>
                        </div>
                    </form>

                    <div id="invalidate-error-message" style="display: none; margin-top: 16px; padding: 12px; background: #fff5f5; border: 1px solid #fc8181; border-radius: 6px; color: #c53030; font-size: 13px;"></div>
                    <div id="invalidate-success-message" style="display: none; margin-top: 16px; padding: 12px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; color: #166534; font-size: 13px;"></div>
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// HANDLERS
// ============================================================================

function openInvalidateSessionModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('invalidate-session-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Inject modal HTML
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML += getInvalidateSessionModalTemplate();

    const modal = document.getElementById('invalidate-session-modal');
    const form = document.getElementById('invalidate-session-form');
    const usernameInput = document.getElementById('invalidate-username');
    const closeBtn = document.getElementById('invalidate-session-modal-close');
    const cancelBtn = document.getElementById('cancel-invalidate-btn');
    const submitBtn = document.getElementById('submit-invalidate-btn');
    const errorMessage = document.getElementById('invalidate-error-message');
    const successMessage = document.getElementById('invalidate-success-message');

    // Close modal handler
    const closeModal = () => {
        modal.remove();
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target.id === 'invalidate-session-modal') {
            closeModal();
        }
    });

    // Close on Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = usernameInput.value.trim();

        if (!username) {
            showError('Please enter a username');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';

        try {
            const response = await fetch(`${API_URL}/customers/${username}/invalidate-session`, {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to invalidate session');
            }

            showSuccess(`✓ Successfully force logged out user: ${username}`);
            usernameInput.value = '';

            // Close modal after 2 seconds
            setTimeout(() => {
                closeModal();
            }, 2000);

        } catch (error) {
            showError(error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Force Logout';
        }
    });

    function showError(message) {
        errorMessage.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">❌</span>
                <span>${message}</span>
            </div>
        `;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }

    function showSuccess(message) {
        successMessage.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">✓</span>
                <span>${message}</span>
            </div>
        `;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    openInvalidateSessionModal,
    getInvalidateSessionModalTemplate
};


