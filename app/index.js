const { getLoginPageTemplate, initLoginPage } = require('./pages/login');
const { getDashboardPageTemplate } = require('./pages/uploader');
const { initDashboardPage, logMessage } = require('./pages/uploadHandlers');
const { getAutobotPageTemplate, initAutobotPage } = require('./pages/autobot');
const { getProfilePageTemplate, initProfilePage } = require('./pages/profile');
const { getSetupPageTemplate, initSetupPage } = require('./pages/setup');

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
            initAutobotPage(this);

        } else if (this.currentRoute === 'profile') {
            if (!this.checkAuth()) {
                this.navigate('login');
                return;
            }

            app.innerHTML = getProfilePageTemplate();
            initProfilePage(this);

        } else if (this.currentRoute === 'setup') {
            if (!this.checkAuth()) {
                this.navigate('login');
                return;
            }

            app.innerHTML = getSetupPageTemplate();
            initSetupPage(this);

        } else if (this.currentRoute === 'upload') {
            if (!this.checkAuth()) {
                this.navigate('login');
                return;
            }

            // Render dashboard
            app.innerHTML = getDashboardPageTemplate();
            initDashboardPage(this);
        }
    },
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

