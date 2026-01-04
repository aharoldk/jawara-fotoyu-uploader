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
                    <h1>Fotoyu Upload</h1>
                    <div class="user-info">
                        <span class="user-name">${customer.username || 'User'}</span>
                        <button class="logout-btn" id="logout-btn">Logout</button>
                    </div>
                </div>

                <div class="container">
                    <div class="upload-section">
                        <h2>Upload Photos</h2>
                        
                        <div class="upload-area" id="upload-area">
                            <div class="upload-icon">📁</div>
                            <div class="upload-text">Click to select files or drag and drop</div>
                            <div class="upload-hint">Support for multiple image files (JPG, PNG, GIF)</div>
                        </div>

                        <input type="file" id="file-input" multiple accept="image/*">

                        <div class="file-list" id="file-list"></div>

                        <button class="upload-btn" id="upload-btn" disabled>Upload Photos</button>

                        <div class="status-message" id="status-message"></div>
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
        this.selectedFiles = [];

        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        const fileList = document.getElementById('file-list');
        const uploadBtn = document.getElementById('upload-btn');
        const statusMessage = document.getElementById('status-message');
        const logoutBtn = document.getElementById('logout-btn');

        // Logout
        logoutBtn.addEventListener('click', () => {
            this.logout();
        });

        // Click to select files
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // Upload button
        uploadBtn.addEventListener('click', () => {
            this.uploadFiles();
        });
    },

    handleFiles(files) {
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            this.showStatus('Please select image files only', 'error');
            return;
        }

        this.selectedFiles = [...this.selectedFiles, ...imageFiles];
        this.updateFileList();
        this.updateUploadButton();
    },

    updateFileList() {
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = '';

        this.selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';

            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-icon">🖼️</div>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${this.formatFileSize(file.size)}</div>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn btn-danger" data-index="${index}">Remove</button>
                </div>
            `;

            // Add event listener to remove button
            const removeBtn = fileItem.querySelector('.btn-danger');
            removeBtn.addEventListener('click', () => {
                this.removeFile(index);
            });

            fileList.appendChild(fileItem);
        });
    },

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updateFileList();
        this.updateUploadButton();
    },

    updateUploadButton() {
        const uploadBtn = document.getElementById('upload-btn');
        if (uploadBtn) {
            uploadBtn.disabled = this.selectedFiles.length === 0;
        }
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    showStatus(message, type) {
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.textContent = message;
            statusMessage.className = `status-message ${type} show`;

            setTimeout(() => {
                statusMessage.className = 'status-message';
            }, 5000);
        }
    },

    async uploadFiles() {
        if (this.selectedFiles.length === 0) return;

        const uploadBtn = document.getElementById('upload-btn');
        const fileInput = document.getElementById('file-input');
        const token = localStorage.getItem('token');
        const customer = JSON.parse(localStorage.getItem('customer') || '{}');

        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading...';

        try {
            // Create FormData
            const formData = new FormData();
            this.selectedFiles.forEach(file => {
                formData.append('photos', file);
            });

            // Add customer info
            formData.append('customerId', customer.id);
            formData.append('customerName', customer.username);

            // Upload
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.status === 401) {
                const error = await response.json();
                if (error.code === 'SESSION_EXPIRED') {
                    // Session expired - another device logged in
                    alert('Your session has been terminated because you logged in from another device. Please login again.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('customer');
                    this.navigate('login');
                    return;
                }
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Upload failed');
            }

            const result = await response.json();

            this.showStatus(`Successfully uploaded ${this.selectedFiles.length} photo(s)!`, 'success');

            // Clear files
            this.selectedFiles = [];
            this.updateFileList();
            fileInput.value = '';

        } catch (error) {
            console.error('Upload error:', error);
            this.showStatus(error.message || 'Upload failed. Please try again.', 'error');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload Photos';
            this.updateUploadButton();
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

