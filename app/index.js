// Router and App Logic
const API_URL = 'http://localhost:3000/api';

// Router
const router = {
    currentRoute: '',

    async init() {
        // Validate session on startup
        await this.validateSession();
        this.navigate(this.getInitialRoute());
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

    checkAuth() {
        const token = localStorage.getItem('token');
        const customer = localStorage.getItem('customer');
        return token && customer;
    },

    getLoginPage() {
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
                            <input 
                                type="password" 
                                id="password" 
                                class="ant-input-password ant-input" 
                                placeholder="Enter your password"
                                required
                            >
                        </div>

                        <button type="submit" class="ant-btn ant-btn-primary">
                            Login
                        </button>
                    </form>

                    <div id="error-message" class="error-message"></div>
                </div>
            </div>
        `;
    },

    getUploadPage() {
        const customer = JSON.parse(localStorage.getItem('customer') || '{}');

        return `
            <div class="upload-page">
                <div class="header">
                    <h1>Fotoyu Bot Uploader</h1>
                    <div class="user-info">
                        <span class="user-name">${customer.username || 'User'}</span>
                        <button class="logout-btn" id="logout-btn">Logout</button>
                    </div>
                </div>

                <div class="container">
                    <div class="panel">
                        <label>👤 Username</label>
                        <input id="username" type="text" placeholder="Enter username" value="${customer.username || ''}" readonly />
                    </div>

                    <div class="panel">
                        <label>📂 Select Folder</label>
                        <button id="selectFolder">📁 Choose Folder</button>
                        <div id="folderPath"></div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="panel">
                            <label>🎬 Content Type</label>
                            <select id="contentType">
                                <option value="Photo">📸 Photo</option>
                                <option value="Video">🎥 Video</option>
                            </select>
                        </div>

                        <div class="panel">
                            <label>📦 Batch Size</label>
                            <input id="batchSize" type="number" value="500" min="1" />
                        </div>
                    </div>

                    <div class="panel">
                        <label>💰 Harga <span style="color: #ff6b6b;">*</span></label>
                        <input id="harga" type="number" placeholder="Enter harga" value="${customer.price || ''}" required />
                    </div>

                    <div class="panel">
                        <label>📍 Lokasi <span style="color: #adb5bd; font-size: 12px;">(optional)</span></label>
                        <input id="lokasi" type="text" placeholder="Enter lokasi" value="${customer.location || ''}" />
                    </div>

                    <div class="panel">
                        <label>📅 Tanggal <span style="color: #adb5bd; font-size: 12px;">(optional)</span></label>
                        <input id="tanggal" type="date" />
                    </div>

                    <div class="panel">
                        <label>📝 Deskripsi <span style="color: #adb5bd; font-size: 12px;">(optional)</span></label>
                        <input id="deskripsi" type="text" placeholder="Enter deskripsi" value="${customer.description || ''}" />
                    </div>

                    <div class="panel">
                        <label>🌳 FotoTree <span style="color: #adb5bd; font-size: 12px;">(optional)</span></label>
                        <input id="fototree-search" type="text" placeholder="Search for FotoTree..." />
                        <div id="fototree-results"></div>
                        <input id="fototree" type="hidden" />
                    </div>

                    <div class="panel">
                        <button id="startBtn">▶ Start Upload</button>
                    </div>

                    <div class="panel">
                        <h3 style="margin-bottom: 16px; color: #495057; font-size: 16px; font-weight: 700;">📊 Logs</h3>
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

        const logoutBtn = document.getElementById('logout-btn');
        const selectFolderBtn = document.getElementById('selectFolder');
        const startBtn = document.getElementById('startBtn');
        const fototreeSearch = document.getElementById('fototree-search');

        // Listen for bot logs from main process
        const { ipcRenderer } = require('electron');
        ipcRenderer.on('bot-log', (event, { message, type }) => {
            this.log(message, type);
        });

        // Logout
        logoutBtn.addEventListener('click', () => {
            this.logout();
        });

        // Select Folder (Note: Browser-based file selection is limited, we'll use file input)
        selectFolderBtn.addEventListener('click', () => {
            this.selectFolder();
        });

        // Start Upload
        startBtn.addEventListener('click', () => {
            this.startUpload();
        });

        // FotoTree Search with debouncing
        if (fototreeSearch) {
            fototreeSearch.addEventListener('input', () => {
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
                folderPath.textContent = `Selected: ${folderName}`;

                this.log(`Folder selected: ${result.folderPath}`);
            }
        } catch (error) {
            console.error('Error selecting folder:', error);
            this.log('Error selecting folder', 'error');
        }
    },

    async startUpload() {
        const contentType = document.getElementById('contentType').value;
        const batchSize = parseInt(document.getElementById('batchSize').value) || 500;
        const harga = document.getElementById('harga').value;
        const lokasi = document.getElementById('lokasi').value;
        const tanggal = document.getElementById('tanggal').value;
        const deskripsi = document.getElementById('deskripsi').value;
        const fototree = document.getElementById('fototree').value;

        // Validation
        if (!harga) {
            this.log('Error: Harga is required', 'error');
            alert('Please enter Harga');
            return;
        }

        if (!this.selectedFolder) {
            this.log('Error: No folder selected', 'error');
            alert('Please select a folder first');
            return;
        }

        const customer = JSON.parse(localStorage.getItem('customer') || '{}');

        this.log(`Starting upload bot...`);
        this.log(`Content Type: ${contentType}, Harga: ${harga}, Batch Size: ${batchSize}`);

        const startBtn = document.getElementById('startBtn');
        startBtn.disabled = true;
        startBtn.textContent = '⏸ Uploading...';

        try {
            const { ipcRenderer } = require('electron');

            // Run the bot automation
            const result = await ipcRenderer.invoke('run-bot', {
                username: customer.username,
                contentType: contentType,
                folderPath: this.selectedFolder,
                batchSize: batchSize,
                harga: harga,
                lokasi: lokasi,
                tanggal: tanggal,
                deskripsi: deskripsi,
                fototree: fototree
            });

            if (result.success) {
                this.log(`Upload completed successfully! Total: ${result.totalFiles} files`, 'success');

                // Reset form
                this.selectedFolder = null;
                document.getElementById('folderPath').textContent = '';
                document.getElementById('harga').value = '';
                document.getElementById('lokasi').value = '';
                document.getElementById('tanggal').value = '';
                document.getElementById('deskripsi').value = '';
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
            startBtn.textContent = '▶ Start Upload';
        }
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
                        fototreeInput.value = item.id; // Store the ID for the bot
                        resultsDiv.innerHTML = '';
                        resultsDiv.style.display = 'none';

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

