const API_URL = process.env.API_URL;
const { openInvalidateSessionModal } = require('../modals/invalidateSessionModal');

/**
 * Login Page - Template and Handlers
 */
function getLoginPageTemplate() {
    const version = require('../package.json').version;

    return `
        <div class="login-page">
            <div id="modal-container"></div>
            
            <div class="login-container">
                <div class="login-header">
                    <h1>Fotoyu Bot Uploader</h1>
                    <p style="color: #718096; font-size: 14px; margin-bottom: 8px;">Login to continue</p>
                </div>

                <form id="login-form">
                    <div class="ant-form-item">
                        <label class="ant-form-item-label">Username</label>
                        <input 
                            type="text" 
                            id="username" 
                            class="ant-input" 
                            placeholder="Enter your username"
                            required
                        >
                    </div>

                    <div class="ant-form-item">
                        <label class="ant-form-item-label">Password</label>
                        <div style="position: relative;">
                            <input 
                                type="password" 
                                id="password" 
                                class="ant-input-password ant-input" 
                                placeholder="Enter your password"
                                required
                                style="padding-right: 40px;"
                            >
                            <button id="toggle-login-password" type="button" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 18px; color: #718096; padding: 4px 8px;">👁️</button>
                        </div>
                    </div>

                    <button type="submit" class="ant-btn ant-btn-primary">
                        Login
                    </button>
                    
                <div style="margin-top: 16px;">
                    <button class="profile-btn" id="invalidate-session-btn" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3); display: flex; align-items: center; gap: 6px; border-radius: 8px; font-weight: 600; font-size: 13px; padding: 10px 16px; transition: all 0.2s ease; width: 100%; justify-content: center; border: none; cursor: pointer; color: white;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(245, 158, 11, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(245, 158, 11, 0.3)'">
                        <span>Force Logout Device</span>
                    </button>
                </div>
                </form>

                <div id="error-message" class="error-message"></div>
                
                <div style="text-align: center; margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #718096; font-size: 12px; margin: 0; padding-bottom: 10px;">
                        Version ${version}
                    </p>
                    <p style="color: #a0aec0; font-size: 11px; margin: 0;">
                        © ${new Date().getFullYear()} Jawara Digital Solution. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    `;
}

function initLoginPage(router) {
    const form = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('toggle-login-password');
    const errorMessage = document.getElementById('error-message');
    const loginContainer = document.querySelector('.login-container');
    const invalidateSessionBtn = document.getElementById('invalidate-session-btn');

    // Invalidate Session button handler
    if (invalidateSessionBtn) {
        invalidateSessionBtn.addEventListener('click', () => {
            openInvalidateSessionModal();
        });
    }

    // Password visibility toggle
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                togglePasswordBtn.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                togglePasswordBtn.textContent = '👁️';
            }
        });
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            showError('Please enter both username and password');
            return;
        }

        loginContainer.classList.add('loading');
        errorMessage.classList.remove('show');

        try {
            const response = await fetch(`${API_URL}/customers/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Login failed');
            }

            // Store token and customer info
            localStorage.setItem('token', data.token);
            localStorage.setItem('customer', JSON.stringify(data.customer));

            // Navigate to upload page
            router.navigate('upload');

        } catch (error) {
            showError(error.message);
        } finally {
            loginContainer.classList.remove('loading');
        }
    });

    function showError(message) {
        if (errorMessage) {
            errorMessage.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <span style="font-size: 16px;">❌</span>
                    <span>${message}</span>
                </div>
            `;
            errorMessage.classList.add('show');

            setTimeout(() => {
                errorMessage.classList.remove('show');
            }, 5000);
        }
    }
}

module.exports = {
    getLoginPageTemplate,
    initLoginPage
};

