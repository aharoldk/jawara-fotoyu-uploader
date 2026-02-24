/* ===========================================================================
   FOTOYU BOT UPLOADER - Main Application (Refactored)
   ===========================================================================
   Clean, modular structure with separated concerns
   =========================================================================== */

// ============================================================================
// IMPORTS
// ============================================================================

const { getLoginPageTemplate, initLoginPage } = require('./pages/login');
const { getDashboardPageTemplate } = require('./pages/uploader');
const { initDashboardPage, logMessage } = require('./pages/uploadHandlers');
const { getAutobotPageTemplate, initAutobotPage } = require('./pages/autobot');
const { getProfileModalTemplate, openProfileModal } = require('./modals/profileModal');
const { getSetupModalTemplate, openSetupModal } = require('./modals/setupModal');

const API_URL = process.env.API_URL;

/**
 * Copy text to clipboard with visual feedback
 */
function copyCode(button, text) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        button.classList.add('copied');

        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    });
}

window.copyCode = copyCode;

const router = {
    currentRoute: '',
    sessionValidationInterval: null,

    async init() {
        this.navigate(this.getInitialRoute());
    },

    cleanup() {
        if (this.sessionValidationInterval) {
            clearInterval(this.sessionValidationInterval);
            this.sessionValidationInterval = null;
        }
    },

    getInitialRoute() {
        return this.checkAuth() ? 'upload' : 'login';
    },

    checkAuth() {
        const token = localStorage.getItem('token');
        const customer = localStorage.getItem('customer');
        return token && customer;
    },

    navigate(route) {
        this.currentRoute = route;
        this.render();
    },

    render() {
        const app = document.getElementById('app');

        if (this.currentRoute === 'login') {
            app.innerHTML = getLoginPageTemplate();
            initLoginPage(this);

        } else if (this.currentRoute === 'autobot') {
            if (!this.checkAuth()) {
                this.navigate('login');
                return;
            }

            // Check if user has Pro subscription
            const customer = JSON.parse(localStorage.getItem('customer') || '{}');
            const isProUser = customer.subscriptionType === 'Pro';

            if (!isProUser) {
                console.log('Autobot feature is only available for Pro users. Redirecting to upload page.');
                alert('⚠️ Autobot feature is only available for Pro subscribers.\n\nPlease contact admin to upgrade your subscription.');
                this.navigate('upload');
                return;
            }

            // Render autobot page
            app.innerHTML = getAutobotPageTemplate();

            // Inject modals into modal container
            const modalContainer = document.getElementById('modal-container');
            if (modalContainer) {
                modalContainer.innerHTML = getProfileModalTemplate() + getSetupModalTemplate();
            }

            initAutobotPage(this);

            // Setup modal button handlers for header buttons
            this.initModalButtons();

        } else if (this.currentRoute === 'upload') {
            if (!this.checkAuth()) {
                this.navigate('login');
                return;
            }

            // Render dashboard
            app.innerHTML = getDashboardPageTemplate();

            // Inject modals into modal container
            const modalContainer = document.getElementById('modal-container');
            if (modalContainer) {
                modalContainer.innerHTML = getProfileModalTemplate() + getSetupModalTemplate();
            }

            // Initialize dashboard handlers
            initDashboardPage(this);

            // Setup modal button handlers
            this.initModalButtons();
        }
    },

    initModalButtons() {
        // Profile modal
        const profileBtn = document.getElementById('profile-modal-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                openProfileModal(this);
            });
        }

        // Setup/Playwright modal
        const playwrightInfoBtn = document.getElementById('setup-modal-btn');
        if (playwrightInfoBtn) {
            playwrightInfoBtn.addEventListener('click', () => {
                openSetupModal();
            });
        }
    },

    async validateSession() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/customers/validate-session`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!data.valid) {
                console.log('Session invalid:', data.message);
                localStorage.removeItem('token');
                localStorage.removeItem('customer');

                if (data.code === 'SESSION_EXPIRED') {
                    setTimeout(() => {
                        alert('Your session has expired or been terminated. Please login again.');
                    }, 100);
                }
            }
        } catch (error) {
            console.error('Session validation error:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('customer');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    router.init();
});

window.addEventListener('beforeunload', () => {
    router.cleanup();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = router;
}

