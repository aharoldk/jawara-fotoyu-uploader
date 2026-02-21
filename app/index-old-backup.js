/* ===========================================================================
   FOTOYU BOT UPLOADER - Main Application
   ===========================================================================
   Structure:
   1. Configuration & Globals
   2. Utilities
   3. Router & Navigation
   4. Authentication
   5. Templates (Login & Upload Pages)
   6. Page Initialization
   7. Event Handlers
   8. API Services
   =========================================================================== */

// ============================================================================
// 1. CONFIGURATION & GLOBALS
// ============================================================================

const API_URL = process.env.API_URL;

// ============================================================================
// 2. UTILITIES
// ============================================================================

/**
 * Copy text to clipboard with visual feedback
 * @param {HTMLElement} button - Button element
 * @param {string} text - Text to copy
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

// ============================================================================
// 3. ROUTER & NAVIGATION
// ============================================================================

const router = {
    currentRoute: '',
    sessionValidationInterval: null,

    async init() {
        this.navigate(this.getInitialRoute());
    },

    cleanup() {
        // Clear the validation interval when app closes
        if (this.sessionValidationInterval) {
            clearInterval(this.sessionValidationInterval);
            this.sessionValidationInterval = null;
        }
    },

    async validateSession() {
        const token = localStorage.getItem('token');

        // If no token, skip validation
        if (!token) {
            return;
        }

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
                // Session is invalid, clear storage
                console.log('Session invalid:', data.message);
                localStorage.removeItem('token');
                localStorage.removeItem('customer');

                // Show alert if session was expired
                if (data.code === 'SESSION_EXPIRED') {
                    setTimeout(() => {
                        alert('Your session has expired or been terminated. Please login again.');
                    }, 100);
                }
            }
        } catch (error) {
            console.error('Session validation error:', error);
            // On error, clear session to be safe
            localStorage.removeItem('token');
            localStorage.removeItem('customer');
        }
    },

    getInitialRoute() {
        const token = localStorage.getItem('token');
        return token ? 'upload' : 'login';
    },

    navigate(route) {
        this.currentRoute = route;
        this.render();
    },

    render() {
        const app = document.getElementById('app');

        if (this.currentRoute === 'login') {
            app.innerHTML = this.getLoginPage();
            this.initLoginPage();
        } else if (this.currentRoute === 'upload') {
            if (!this.checkAuth()) {
                this.navigate('login');
                return;
            }
            app.innerHTML = this.getUploadPage();
            this.initUploadPage();
        }
    },

    // ========================================================================
    // 4. AUTHENTICATION
    // ========================================================================

    checkAuth() {
        const token = localStorage.getItem('token');
        const customer = localStorage.getItem('customer');
        return token && customer;
    },

    // ========================================================================
    // 5. PAGE TEMPLATES
    // ========================================================================

    getLoginPage() {
        const version = require('./package.json').version;

        return `
            <div class="login-page">
                <div class="login-container">
                    <div class="login-header">
                        <h1>Fotoyu Bot</h1>
                        <p>Login to continue</p>
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
                    </form>

                    <div id="error-message" class="error-message"></div>
                    
                    <div style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                        <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                            Version ${version}
                        </p>
                    </div>
                </div>
            </div>
        `;
    },

    getUploadPage() {
        const customer = JSON.parse(localStorage.getItem('customer') || '{}');
        const version = require('./package.json').version;

        return `
            <div class="upload-page">
                <div class="header">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <h1>Fotoyu Bot Uploader</h1>
                        <span style="background: #e2e8f0; color: #4a5568; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">v${version}</span>
                    </div>
                    <div class="user-info">
                        <span class="user-name">${customer.username || 'User'}</span>
                        <button class="profile-btn" id="playwright-info-btn" style="background: #805ad5; margin-right: 8px;" onmouseover="this.style.background='#6b46c1'" onmouseout="this.style.background='#805ad5'">🎭 Setup</button>
                        <button class="profile-btn" id="profile-btn">Profile</button>
                        <button class="logout-btn" id="logout-btn">Logout</button>
                    </div>
                </div>

                <!-- Profile Modal -->
                <div id="profile-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Profile Settings</h2>
                            <button class="modal-close" id="close-profile-modal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <form id="profile-form">
                                <div class="form-group">
                                    <label>Username</label>
                                    <input type="text" id="profile-username" value="${customer.username || ''}" readonly />
                                </div>
                                
                                <div class="form-group">
                                    <label>Price</label>
                                    <input type="number" id="profile-price" value="${customer.price || ''}" />
                                </div>
                                
                                <div class="form-group">
                                    <label>Description</label>
                                    <input type="text" id="profile-description" value="${customer.description || ''}" />
                                </div>
                                
                                <div class="form-group">
                                    <label>FotoTree <span style="color: #a0aec0; font-size: 12px;">(optional)</span></label>
                                    <div style="position: relative;">
                                        <input 
                                            type="text" 
                                            id="profile-fototree-search" 
                                            value="${customer.fotoTree || ''}" 
                                            placeholder="Search FotoTree..." 
                                            autocomplete="off"
                                        />
                                        <div id="profile-fototree-results" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e2e8f0; border-radius: 4px; max-height: 200px; overflow-y: auto; z-index: 1000; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-top: 4px;"></div>
                                    </div>
                                    <p style="color: #718096; font-size: 12px; margin-top: 4px;">
                                        ℹ️ FotoTree classification for your uploads. Type to search or leave empty.
                                    </p>
                                </div>
                                
                                <div class="form-group">
                                    <label>Concurrent Tabs <span style="color: #a0aec0; font-size: 12px;">(1-10, higher = faster uploads)</span></label>
                                    <input type="number" id="profile-concurrent-tabs" value="${customer.concurrentTabs || 1}" min="1" max="10" />
                                    <p style="color: #718096; font-size: 12px; margin-top: 4px;">
                                        ℹ️ Number of browser tabs to use for concurrent uploads. Recommended: 2-4 for most users.
                                    </p>
                                </div>
                                
                                <div class="form-group">
                                    <label>Batch Size <span style="color: #a0aec0; font-size: 12px;">(10-2000, files per batch)</span></label>
                                    <input type="number" id="profile-batch-size" value="${customer.batchSize || 10}" min="10" max="2000" />
                                    <p style="color: #718096; font-size: 12px; margin-top: 4px;">
                                        ℹ️ Number of files to upload per batch. Smaller = safer, Larger = faster. Recommended: 50-100.
                                    </p>
                                </div>
                                
                                <div class="form-group">
                                    <label>New Password <span style="color: #a0aec0; font-size: 12px;">(leave blank to keep current)</span></label>
                                    <input type="password" id="profile-new-password" placeholder="Enter new password" />
                                </div>
                                
                                <div class="form-group">
                                    <label>Confirm Password</label>
                                    <input type="password" id="profile-confirm-password" placeholder="Confirm new password" />
                                </div>
                                
                                <button type="submit" class="btn-primary">Save Changes</button>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Playwright Installation Info Modal -->
                <div id="playwright-info-modal" class="modal" style="display: none;">
                    <div class="modal-content" style="max-width: 700px;">
                        <div class="modal-header">
                            <h2>🎭 Playwright Setup Guide</h2>
                            <button class="modal-close" id="close-playwright-modal">&times;</button>
                        </div>
                        <div class="modal-body">
                            
                            <!-- Step 1: Check Prerequisites -->
                            <div class="form-group">
                                <label style="font-size: 16px; font-weight: 600; color: #2d3748; margin-bottom: 8px;">Step 1: Check if Node.js & NPX are installed</label>
                                <p style="color: #718096; font-size: 14px; margin-bottom: 12px;">Open Terminal (macOS) or Command Prompt (Windows) and run:</p>
                                <div style="background: #2d3748; color: #f7fafc; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; position: relative; margin-bottom: 8px;">
                                    node --version && npx --version
                                    <button onclick="copyCode(this, 'node --version && npx --version')" style="position: absolute; right: 8px; top: 8px; background: #4a5568; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Copy</button>
                                </div>
                                <p style="color: #718096; font-size: 13px;">
                                    ✅ If you see version numbers → Skip to Step 3<br>
                                    ❌ If "command not found" → Continue to Step 2
                                </p>
                            </div>

                            <!-- Step 2: Install Node.js -->
                            <div class="form-group">
                                <label style="font-size: 16px; font-weight: 600; color: #2d3748; margin-bottom: 8px;">Step 2: Install Node.js (if needed)</label>
                                
                                <div style="margin-bottom: 16px;">
                                    <p style="font-weight: 600; color: #2d3748; margin-bottom: 8px;">🍎 macOS:</p>
                                    <p style="color: #718096; font-size: 14px; margin-bottom: 8px;">Option A: Using Homebrew</p>
                                    <div style="background: #2d3748; color: #f7fafc; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; position: relative; margin-bottom: 12px;">
                                        brew install node
                                        <button onclick="copyCode(this, 'brew install node')" style="position: absolute; right: 8px; top: 8px; background: #4a5568; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Copy</button>
                                    </div>
                                    <p style="color: #718096; font-size: 14px;">Option B: Download from <a href="https://nodejs.org" target="_blank" style="color: #4299e1;">nodejs.org</a></p>
                                </div>

                                <div style="margin-bottom: 16px;">
                                    <p style="font-weight: 600; color: #2d3748; margin-bottom: 8px;">🪟 Windows:</p>
                                    <p style="color: #718096; font-size: 14px; margin-bottom: 8px;">Option A: Download from <a href="https://nodejs.org" target="_blank" style="color: #4299e1;">nodejs.org</a> (Recommended)</p>
                                    <p style="color: #718096; font-size: 14px; margin-bottom: 8px;">Option B: Using Chocolatey</p>
                                    <div style="background: #2d3748; color: #f7fafc; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; position: relative;">
                                        choco install nodejs
                                        <button onclick="copyCode(this, 'choco install nodejs')" style="position: absolute; right: 8px; top: 8px; background: #4a5568; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Copy</button>
                                    </div>
                                    <p style="color: #e53e3e; font-size: 13px; margin-top: 8px;">⚠️ After installation, restart Terminal/Command Prompt!</p>
                                </div>
                            </div>

                            <!-- Step 3: Install Playwright -->
                            <div class="form-group">
                                <label style="font-size: 16px; font-weight: 600; color: #2d3748; margin-bottom: 8px;">Step 3: Install Playwright Browsers</label>
                                
                                <div style="margin-bottom: 16px;">
                                    <p style="font-weight: 600; color: #2d3748; margin-bottom: 8px;">🍎 macOS:</p>
                                    <p style="color: #718096; font-size: 14px; margin-bottom: 8px;">1. Navigate to app directory:</p>
                                    <div style="background: #2d3748; color: #f7fafc; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; position: relative; margin-bottom: 12px;">
                                        cd /Applications/Fotoyu\\ Bot\\ Uploader.app/Contents/Resources/app
                                        <button onclick="copyCode(this, 'cd /Applications/Fotoyu\\\\ Bot\\\\ Uploader.app/Contents/Resources/app')" style="position: absolute; right: 8px; top: 8px; background: #4a5568; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Copy</button>
                                    </div>
                                    <p style="color: #718096; font-size: 14px; margin-bottom: 8px;">2. Install Playwright:</p>
                                    <div style="background: #2d3748; color: #f7fafc; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; position: relative;">
                                        npx playwright install chromium
                                        <button onclick="copyCode(this, 'npx playwright install chromium')" style="position: absolute; right: 8px; top: 8px; background: #4a5568; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Copy</button>
                                    </div>
                                </div>

                                <div style="margin-bottom: 16px;">
                                    <p style="font-weight: 600; color: #2d3748; margin-bottom: 8px;">🪟 Windows:</p>
                                    <p style="color: #718096; font-size: 14px; margin-bottom: 8px;">1. Open Command Prompt as Administrator</p>
                                    <p style="color: #718096; font-size: 14px; margin-bottom: 8px;">2. Navigate to app directory:</p>
                                    <div style="background: #2d3748; color: #f7fafc; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; position: relative; margin-bottom: 12px;">
                                        cd "%LOCALAPPDATA%\\Programs\\fotoyu-bot-uploader\\resources\\app"
                                        <button onclick="copyCode(this, 'cd \"%LOCALAPPDATA%\\\\Programs\\\\fotoyu-bot-uploader\\\\resources\\\\app\"')" style="position: absolute; right: 8px; top: 8px; background: #4a5568; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Copy</button>
                                    </div>
                                    <p style="color: #718096; font-size: 14px; margin-bottom: 8px;">3. Install Playwright:</p>
                                    <div style="background: #2d3748; color: #f7fafc; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; position: relative;">
                                        npx playwright install chromium
                                        <button onclick="copyCode(this, 'npx playwright install chromium')" style="position: absolute; right: 8px; top: 8px; background: #4a5568; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Copy</button>
                                    </div>
                                </div>

                                <p style="color: #718096; font-size: 14px; margin-top: 12px;">
                                    ⏱️ Wait 2-5 minutes for download (~150MB)<br>
                                    🔄 Restart the app after installation
                                </p>
                            </div>

                            <div style="background: #fef5e7; border-left: 4px solid #f39c12; padding: 12px; border-radius: 4px; margin-top: 16px;">
                                <p style="color: #795548; font-size: 13px; margin: 0;">
                                    <strong>💡 Tip:</strong> You only need to install once. If you see browser errors later, run the install command again.
                                </p>
                            </div>

                        </div>
                    </div>
                </div>

                <div class="container">
                    <div class="panel">
                        <label>Username Fotoyu</label>
                        <input id="username" type="text" placeholder="Enter username" value="${customer.username || ''}" readonly />
                    </div>
                    
                    <div class="panel">
                        <label>Password Fotoyu <span style="color: #e53e3e;">*</span></label>
                        <div style="position: relative;">
                            <input id="password-fotoyu" type="password" placeholder="Enter your Fotoyu password" required style="padding-right: 40px;" />
                            <button id="toggle-password" type="button" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 18px; color: #718096; padding: 4px 8px;">👁️</button>
                        </div>
                        <p style="color: #718096; font-size: 12px; margin-top: 8px;">This password is used to login to Fotoyu automatically. It's not stored.</p>
                    </div>

                    <div class="panel">
                        <label>Select Folder</label>
                        <button id="selectFolder">Choose Folder</button>
                        <div id="folderPath"></div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="panel">
                            <label>Content Type</label>
                            <select id="contentType">
                                <option value="Photo">Photo</option>
                                <option value="Video">Video</option>
                            </select>
                        </div>

                        <div class="panel">
                            <label>Concurrent Tabs <span style="color: #a0aec0; font-size: 12px;">(1-10, parallel uploads)</span></label>
                            <input id="concurrentTabs" type="number" value="${customer.concurrentTabs || 1}" min="1" max="10" />
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="panel">
                            <label>Batch Size <span style="color: #a0aec0; font-size: 12px;">(10-2000, files per batch)</span></label>
                            <input id="batchSize" type="number" value="${customer.batchSize || 10}" min="10" max="2000" />
                        </div>

                        <div class="panel">
                            <label>Harga <span style="color: #e53e3e;">*</span></label>
                            <input id="harga" type="number" placeholder="Enter harga" value="${customer.price || ''}" required />
                        </div>
                    </div>

                    <div class="panel">
                        <label>Deskripsi <span style="color: #a0aec0; font-size: 12px;">(optional)</span></label>
                        <input id="deskripsi" type="text" placeholder="Enter deskripsi" value="${customer.description || ''}" />
                    </div>

                    <div class="panel">
                        <label>FotoTree <span style="color: #e53e3e;">*</span></label>
                        <input id="fototree-search" type="text" placeholder="Type to search FotoTree..." value="${customer.fotoTree || ''}"/>
                        <div id="fototree-results"></div>
                        <input id="fototree" type="hidden" value="${customer.fotoTree || ''}"/>
                        <p style="color: #718096; font-size: 12px; margin-top: 8px;">
                            ℹ️ Type at least 3 characters to search, then <strong>click on a result</strong> to select it.
                        </p>
                    </div>

                    <div class="panel">
                        <div style="display: flex; gap: 12px;">
                            <button id="startBtn" style="flex: 1;">Start Upload</button>
                            <button id="stopBtn" style="flex: 1; background-color: #e53e3e; display: none;" disabled>Stop Upload</button>
                        </div>
                    </div>

                    <div class="panel">
                        <h3 style="margin-bottom: 12px; color: #2d3748; font-size: 16px; font-weight: 600;">Logs</h3>
                        <div id="logs"></div>
                    </div>
                </div>
            </div>
        `;
    },

    // Login Page Logic
    initLoginPage() {
        const form = document.getElementById('login-form');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const errorMessage = document.getElementById('error-message');
        const loginContainer = document.querySelector('.login-container');
        const toggleLoginPasswordBtn = document.getElementById('toggle-login-password');

        // Password visibility toggle for login
        if (toggleLoginPasswordBtn && passwordInput) {
            toggleLoginPasswordBtn.addEventListener('click', () => {
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    toggleLoginPasswordBtn.textContent = '🙈';
                } else {
                    passwordInput.type = 'password';
                    toggleLoginPasswordBtn.textContent = '👁️';
                }
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            if (!username || !password) {
                this.showError('Please enter both username and password');
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

                // Store token and customer data
                localStorage.setItem('token', data.token);
                localStorage.setItem('customer', JSON.stringify(data.customer));

                // Navigate to upload page
                this.navigate('upload');

            } catch (error) {
                console.error('Login error:', error);
                this.showError(error.message || 'Login failed. Please try again.');
            } finally {
                loginContainer.classList.remove('loading');
            }
        });
    },

    showError(message) {
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.classList.add('show');

            setTimeout(() => {
                errorMessage.classList.remove('show');
            }, 5000);
        }
    },

    // Upload Page Logic
    initUploadPage() {
        this.selectedFolder = null;
        this.searchTimeout = null; // For debouncing
        this.uploadCancelled = false; // Flag to track if upload was cancelled

        const logoutBtn = document.getElementById('logout-btn');
        const profileBtn = document.getElementById('profile-btn');
        const selectFolderBtn = document.getElementById('selectFolder');
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const fototreeSearch = document.getElementById('fototree-search');
        const togglePasswordBtn = document.getElementById('toggle-password');
        const passwordInput = document.getElementById('password-fotoyu');

        // Listen for bot logs from main process
        const { ipcRenderer } = require('electron');
        ipcRenderer.on('bot-log', (event, { message, type }) => {
            this.log(message, type);
        });

        // Profile Modal
        profileBtn.addEventListener('click', () => {
            this.openProfileModal();
        });

        // Playwright Info Modal
        const playwrightInfoBtn = document.getElementById('playwright-info-btn');
        if (playwrightInfoBtn) {
            playwrightInfoBtn.addEventListener('click', () => {
                this.openPlaywrightInfoModal();
            });
        }

        // Logout
        logoutBtn.addEventListener('click', () => {
            this.logout();
        });

        // Password visibility toggle
        if (togglePasswordBtn && passwordInput) {
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

        // Select Folder (Note: Browser-based file selection is limited, we'll use file input)
        selectFolderBtn.addEventListener('click', () => {
            this.selectFolder();
        });

        // Start Upload
        startBtn.addEventListener('click', () => {
            this.startUpload();
        });

        // Stop Upload
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopUpload();
            });
        }

        // ...existing code...

        // FotoTree Search with debouncing
        if (fototreeSearch) {
            fototreeSearch.addEventListener('input', () => {
                // Clear the hidden input when user types again
                const fototreeInput = document.getElementById('fototree');
                if (fototreeInput.value) {
                    fototreeInput.value = '';
                    // Reset visual feedback
                    fototreeSearch.style.borderColor = '';
                    fototreeSearch.style.backgroundColor = '';
                }

                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(async () => {
                    const searchTerm = fototreeSearch.value;
                    if (searchTerm.length < 3) {
                        const resultsDiv = document.getElementById('fototree-results');
                        resultsDiv.innerHTML = '';
                        resultsDiv.style.display = 'none';
                        return;
                    }

                    await this.searchFotoTree(searchTerm);
                }, 300); // Debounce to avoid excessive API calls
            });
        }
    },

    async selectFolder() {
        try {
            // Use Electron's native folder picker
            const { ipcRenderer } = require('electron');
            const result = await ipcRenderer.invoke('select-folder');

            if (result.success && result.folderPath) {
                this.selectedFolder = result.folderPath;

                const folderPath = document.getElementById('folderPath');
                const folderName = result.folderPath.split('/').pop() || result.folderPath.split('\\').pop();

                // Count files in the folder
                const fileCount = await ipcRenderer.invoke('count-files', result.folderPath);

                folderPath.innerHTML = `
                    <div style="margin-top: 8px;">
                        <div style="color: #2d3748; font-weight: 500;">Selected: ${folderName}</div>
                        <div style="color: #718096; font-size: 14px; margin-top: 4px;">
                            📸 Photos: ${fileCount.photos} | 🎥 Videos: ${fileCount.videos} | 📁 Total: ${fileCount.total}
                        </div>
                    </div>
                `;

                this.log(`Folder selected: ${result.folderPath}`);
                this.log(`Files found - Photos: ${fileCount.photos}, Videos: ${fileCount.videos}, Total: ${fileCount.total}`, 'info');
            }
        } catch (error) {
            console.error('Error selecting folder:', error);
            this.log('Error selecting folder', 'error');
        }
    },

    async startUpload() {
        const contentType = document.getElementById('contentType').value;
        const batchSize = parseInt(document.getElementById('batchSize').value) || 10;
        const concurrentTabs = parseInt(document.getElementById('concurrentTabs').value) || 1;
        const harga = document.getElementById('harga').value;
        const deskripsi = document.getElementById('deskripsi').value;
        const fototree = document.getElementById('fototree').value;
        const fotoyuPassword = document.getElementById('password-fotoyu').value;

        // Reset cancel flag
        this.uploadCancelled = false;

        // Validate session before starting upload
        this.log('Validating session...', 'info');
        await this.validateSession();

        // Check if session is still valid after validation
        const token = localStorage.getItem('token');
        if (!token) {
            this.log('Error: Session expired or invalid', 'error');
            alert('Your session has expired. Please login again.');
            this.navigate('login');
            return;
        }

        // Validation
        if (!harga) {
            this.log('Error: Harga is required', 'error');
            alert('Please enter Harga');
            return;
        }

        if (!fotoyuPassword) {
            this.log('Error: Fotoyu password is required', 'error');
            alert('Please enter your Fotoyu password');
            return;
        }

        // Validate that FotoTree is filled
        if (!fototree) {
            this.log('Error: FotoTree is required', 'error');
            alert('Please select a FotoTree');
            return;
        }

        // Validate that if user typed in FotoTree search but didn't select from dropdown
        const fototreeSearch = document.getElementById('fototree-search').value;
        if (fototreeSearch && !fototree) {
            this.log('Error: Please select a FotoTree from the dropdown list', 'error');
            alert('Please select a FotoTree from the dropdown list (don\'t just type, you must click on a result)');
            return;
        }

        // Validate concurrent tabs
        if (concurrentTabs < 1 || concurrentTabs > 10) {
            this.log('Error: Concurrent Tabs must be between 1 and 10', 'error');
            alert('Concurrent Tabs must be between 1 and 10');
            return;
        }

        // Validate batch size
        if (batchSize < 10 || batchSize > 2000) {
            this.log('Error: Batch Size must be between 10 and 2000', 'error');
            alert('Batch Size must be between 10 and 2000');
            return;
        }

        // Validate batch size based on content type
        const maxBatchSize = contentType === 'Photo' ? 2000 : 50;
        if (batchSize > maxBatchSize) {
            this.log(`Error: Batch size exceeds maximum for ${contentType}`, 'error');
            alert(`Batch size for ${contentType} cannot exceed ${maxBatchSize}. Please enter a smaller batch size.`);
            return;
        }

        if (!this.selectedFolder) {
            this.log('Error: No folder selected', 'error');
            alert('Please select a folder first');
            return;
        }

        const customer = JSON.parse(localStorage.getItem('customer') || '{}');

        this.log(`Starting upload bot...`);
        this.log(`Content Type: ${contentType}, Harga: ${harga}, Batch Size: ${batchSize}, Concurrent Tabs: ${concurrentTabs}`);
        this.log(`Using ${concurrentTabs} tab(s) for parallel uploads`, 'info');

        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');

        startBtn.disabled = true;
        startBtn.textContent = 'Uploading...';
        startBtn.style.display = 'none';

        stopBtn.style.display = 'block';
        stopBtn.disabled = false;

        try {
            const { ipcRenderer } = require('electron');

            // Run the bot automation
            const result = await ipcRenderer.invoke('run-bot', {
                username: customer.username,
                password: fotoyuPassword,
                contentType: contentType,
                folderPath: this.selectedFolder,
                batchSize: batchSize,
                harga: harga,
                deskripsi: deskripsi,
                fototree: fototree,
                concurrentTabs: concurrentTabs
            });

            if (this.uploadCancelled) {
                this.log('Upload was cancelled by user', 'warning');
            } else if (result.cancelled) {
                this.log('Upload was stopped by user', 'warning');
            } else if (result.success) {
                this.log(`Upload completed successfully! Total: ${result.totalFiles} files`, 'success');
            } else {
                this.log(`Upload failed: ${result.error}`, 'error');
                alert(`Upload failed: ${result.error}`);
            }

        } catch (error) {
            console.error('Upload error:', error);
            this.log(`Upload failed: ${error.message}`, 'error');
            alert(`Upload failed: ${error.message}`);
        } finally {
            startBtn.disabled = false;
            startBtn.textContent = 'Start Upload';
            startBtn.style.display = 'block';

            stopBtn.style.display = 'none';
            stopBtn.disabled = true;
        }
    },

    stopUpload() {
        this.uploadCancelled = true;
        this.log('Stopping upload... (will stop at the next checkpoint)', 'warning');

        const { ipcRenderer } = require('electron');
        ipcRenderer.invoke('stop-bot');

        const stopBtn = document.getElementById('stopBtn');
        stopBtn.disabled = true;
        stopBtn.textContent = 'Stopping...';
    },

    log(message, type = 'info') {
        const logsDiv = document.getElementById('logs');
        if (!logsDiv) return;

        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.textContent = `[${timestamp}] ${message}`;

        logsDiv.appendChild(logEntry);
        logsDiv.scrollTop = logsDiv.scrollHeight;
    },

    async searchFotoTree(query) {
        const resultsDiv = document.getElementById('fototree-results');
        const fototreeInput = document.getElementById('fototree');

        if (!resultsDiv) return;

        if (!query || query.length < 3) {
            resultsDiv.innerHTML = '';
            resultsDiv.style.display = 'none';
            return;
        }

        try {
            // Show loading state
            resultsDiv.style.display = 'block';
            resultsDiv.innerHTML = '<div class="fototree-item" style="color: #adb5bd;">Searching...</div>';

            const response = await fetch(`https://api.fotoyu.com/tree/v1/trees/search?page=1&limit=20&name=${encodeURIComponent(query)}&is_upload=true`);

            if (!response.ok) {
                throw new Error('Failed to fetch FotoTree results');
            }

            const data = await response.json();

            resultsDiv.innerHTML = '';

            // Check if we have results - the API returns an array directly in "result"
            const results = data.result || data.data || [];

            if (results.length > 0) {
                results.forEach(item => {
                    const resultItem = document.createElement('div');
                    resultItem.classList.add('fototree-item');
                    resultItem.textContent = item.name;
                    resultItem.style.cursor = 'pointer';

                    resultItem.addEventListener('click', () => {
                        const fototreeSearch = document.getElementById('fototree-search');
                        fototreeSearch.value = item.name;
                        fototreeInput.value = item.name; // Store the name for the bot
                        resultsDiv.innerHTML = '';
                        resultsDiv.style.display = 'none';

                        // Add visual feedback that FotoTree was selected
                        fototreeSearch.style.borderColor = '#10b981';
                        fototreeSearch.style.backgroundColor = '#d1fae5';

                        // Log for user feedback
                        router.log(`FotoTree selected: ${item.name}`, 'success');

                        // Log for debugging
                        console.log('Selected FotoTree:', { name: item.name, id: item.id });
                    });

                    resultsDiv.appendChild(resultItem);
                });
            } else {
                resultsDiv.innerHTML = '<div class="fototree-item" style="color: #6c757d;">No results found</div>';
            }
        } catch (error) {
            console.error('Error fetching FotoTree:', error);
            resultsDiv.innerHTML = '<div class="fototree-item" style="color: #ff6b6b;">Error fetching results. Please try again.</div>';
        }
    },

    // Profile Modal functions
    openProfileModal() {
        const modal = document.getElementById('profile-modal');
        const closeBtn = document.getElementById('close-profile-modal');
        const form = document.getElementById('profile-form');

        modal.style.display = 'flex';

        // Setup FotoTree search
        const fototreeSearchInput = document.getElementById('profile-fototree-search');
        const fototreeResults = document.getElementById('profile-fototree-results');
        let profileFototreeTimeout = null;

        if (fototreeSearchInput) {
            fototreeSearchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();

                // Clear previous timeout
                if (profileFototreeTimeout) {
                    clearTimeout(profileFototreeTimeout);
                }

                if (query.length < 2) {
                    fototreeResults.style.display = 'none';
                    return;
                }

                // Debounce search
                profileFototreeTimeout = setTimeout(async () => {
                    await this.searchProfileFotoTree(query);
                }, 300);
            });

            // Hide results when clicking outside
            document.addEventListener('click', (e) => {
                if (!fototreeSearchInput.contains(e.target) && !fototreeResults.contains(e.target)) {
                    fototreeResults.style.display = 'none';
                }
            });
        }

        // Close modal handler - use once to prevent duplicates
        const closeModal = () => {
            modal.style.display = 'none';
            // Clear the timeout when closing modal
            if (profileFototreeTimeout) {
                clearTimeout(profileFototreeTimeout);
            }
        };

        closeBtn.onclick = closeModal;

        // Close on outside click
        const outsideClickHandler = (e) => {
            if (e.target === modal) {
                closeModal();
                window.removeEventListener('click', outsideClickHandler);
            }
        };
        window.addEventListener('click', outsideClickHandler);

        // Handle profile update - remove existing listener first
        form.onsubmit = async (e) => {
            e.preventDefault();
            await this.updateProfile();
        };
    },

    async searchProfileFotoTree(query) {
        const resultsDiv = document.getElementById('profile-fototree-results');

        try {
            const response = await fetch(`https://api.fotoyu.com/tree/v1/trees/search?page=1&limit=20&name=${encodeURIComponent(query)}&is_upload=true`);

            if (!response.ok) {
                throw new Error('Failed to fetch FotoTree results');
            }

            const data = await response.json();
            const results = data.result || data.data || [];

            if (results.length > 0) {
                resultsDiv.innerHTML = results.map(item => `
                    <div class="fototree-item" data-value="${item.name}" style="padding: 10px; cursor: pointer; border-bottom: 1px solid #e2e8f0;">
                        ${item.name}
                    </div>
                `).join('');

                resultsDiv.style.display = 'block';

                // Add click handlers
                resultsDiv.querySelectorAll('.fototree-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const value = item.getAttribute('data-value');
                        document.getElementById('profile-fototree-search').value = value;
                        resultsDiv.style.display = 'none';
                    });

                    item.addEventListener('mouseenter', (e) => {
                        e.target.style.background = '#f7fafc';
                    });

                    item.addEventListener('mouseleave', (e) => {
                        e.target.style.background = 'white';
                    });
                });
            } else {
                resultsDiv.innerHTML = '<div class="fototree-item" style="padding: 10px; color: #6c757d;">No results found</div>';
                resultsDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Error fetching FotoTree:', error);
            resultsDiv.innerHTML = '<div class="fototree-item" style="padding: 10px; color: #ff6b6b;">Error fetching results. Please try again.</div>';
            resultsDiv.style.display = 'block';
        }
    },

    async updateProfile() {
        const price = document.getElementById('profile-price').value;
        const description = document.getElementById('profile-description').value;
        const fotoTree = document.getElementById('profile-fototree-search').value;
        const concurrentTabs = parseInt(document.getElementById('profile-concurrent-tabs').value) || 1;
        const batchSize = parseInt(document.getElementById('profile-batch-size').value) || 10;
        const newPassword = document.getElementById('profile-new-password').value;
        const confirmPassword = document.getElementById('profile-confirm-password').value;

        // Validate concurrentTabs
        if (concurrentTabs < 1 || concurrentTabs > 10) {
            alert('Concurrent Tabs must be between 1 and 10!');
            return;
        }

        // Validate batchSize
        if (batchSize < 10 || batchSize > 2000) {
            alert('Batch Size must be between 10 and 2000!');
            return;
        }

        // Validate passwords match if provided
        if (newPassword || confirmPassword) {
            if (newPassword !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            if (newPassword.length < 8) {
                alert('Password must be at least 8 characters long!');
                return;
            }
        }

        const token = localStorage.getItem('token');
        const customer = JSON.parse(localStorage.getItem('customer') || '{}');

        try {
            const updateData = {
                price: price ? parseFloat(price) : undefined,
                description: description || undefined,
                fotoTree: fotoTree || undefined,
                concurrentTabs: concurrentTabs,
                batchSize: batchSize,
            };

            // Only include password if provided
            if (newPassword) {
                updateData.password = newPassword;
            }

            const response = await fetch(`${API_URL}/customers/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Update failed');
            }

            // Update local storage with new customer data
            const updatedCustomer = {
                ...customer,
                ...data.customer
            };
            localStorage.setItem('customer', JSON.stringify(updatedCustomer));

            alert('Profile updated successfully!');
            this.log(`Profile updated: Concurrent Tabs=${concurrentTabs}, Batch Size=${batchSize}`, 'success');

            // Close modal and refresh page
            document.getElementById('profile-modal').style.display = 'none';
            this.navigate('upload');

        } catch (error) {
            console.error('Profile update error:', error);
            alert(`Failed to update profile: ${error.message}`);
        }
    },

    // Playwright Info Modal functions
    openPlaywrightInfoModal() {
        const modal = document.getElementById('playwright-info-modal');
        const closeBtn = document.getElementById('close-playwright-modal');

        modal.style.display = 'flex';

        // Close modal handler
        const closeModal = () => {
            modal.style.display = 'none';
        };

        closeBtn.onclick = closeModal;

        // Close when clicking outside
        window.onclick = function(e) {
            if (e.target === modal) {
                closeModal();
            }
        };
    },

    // Logout function
    async logout() {
        const token = localStorage.getItem('token');

        if (token) {
            try {
                await fetch(`${API_URL}/customers/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }

        localStorage.removeItem('token');
        localStorage.removeItem('customer');
        this.navigate('login');
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    router.init();
});

// Cleanup when window is closed
window.addEventListener('beforeunload', () => {
    router.cleanup();
});

