/**
 * Autobot Page - Automatic Upload Configuration
 */
const { getSharedHeader } = require('../components/sharedHeader');
const { initSharedHeader } = require('../components/sharedHeader');
const { apiFetch, setRouter, validateSession } = require('../utils/apiFetch');
const API_URL = process.env.API_URL;

let searchTimeout = null;

function getAutobotPageTemplate() {
    const customer = JSON.parse(localStorage.getItem('customer') || '{}');

    return `
        <div class="autobot-page">
            ${getSharedHeader('autobot')}
            
            <div class="container">
                <div class="panel">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                        <span style="font-size: 32px;">🤖</span>
                        <div>
                            <h3>Hi, I'm Alfred. I'll do your boring work while you busy 💼</h3>
                            <p style="margin: 4px 0 0 0; color: #718096; font-size: 14px;">Because manually uploading 2000 photos is totally fun... said no one ever</p>
                        </div>
                    </div>
                    
                    <div class="panel" style="background: #f7fafc; border: 2px dashed #cbd5e0; margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3748;">📁 Select Folder</label>
                        <button id="selectFolder" style="padding: 10px 20px; background: #4299e1; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s;">
                            Choose Folder
                        </button>
                        <div id="folderPath" style="margin-top: 12px;"></div>
                    </div>
                    
                    <div class="ant-form-item" style="margin-bottom: 20px;">
                        <label class="ant-form-item-label">Password Fotoyu <span style="color: #e53e3e;">*</span></label>
                        <div style="position: relative;">
                            <input 
                                type="password" 
                                id="autobot-password" 
                                class="ant-input" 
                                placeholder="Enter your Fotoyu password"
                                required
                                style="padding-right: 40px;"
                            >
                            <button id="toggle-autobot-password" type="button" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 18px; color: #718096; padding: 4px 8px;">👁️</button>
                        </div>
                        <p style="color: #718096; font-size: 12px; margin-top: 8px;">This password is used to login to Fotoyu automatically. It's not stored.</p>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                        <div class="ant-form-item">
                            <label class="ant-form-item-label">Harga Foto<span style="color: #e53e3e;">*</span></label>
                            <input 
                                type="number" 
                                id="autobot-price-photo" 
                                class="ant-input" 
                                placeholder="Enter price"
                                value="${customer.pricePhoto || ''}"
                                required
                            >
                        </div>

                        <div class="ant-form-item">
                            <label class="ant-form-item-label">Harga Video<span style="color: #e53e3e;">*</span></label>
                            <input 
                                type="number" 
                                id="autobot-price-video" 
                                class="ant-input" 
                                placeholder="Enter price"
                                value="${customer.priceVideo || ''}"
                                required
                            >
                        </div>
                    </div>

                    <div class="ant-form-item" style="margin-bottom: 20px;">
                        <label class="ant-form-item-label">Deskripsi <span style="color: #a0aec0; font-size: 12px;">(optional)</span></label>
                        <input 
                            type="text" 
                            id="autobot-description" 
                            class="ant-input" 
                            placeholder="Enter description"
                            value="${customer.description || ''}"
                        >
                    </div>

                    <div class="ant-form-item" style="margin-bottom: 20px;">
                        <label class="ant-form-item-label">FotoTree <span style="color: #e53e3e;">*</span></label>
                        <input 
                            id="autobot-fototree-search" 
                            type="text" 
                            class="ant-input" 
                            placeholder="Type to search FotoTree..." 
                            value="${customer.fotoTree || ''}"
                        />
                        <div id="autobot-fototree-results"></div>
                        <input id="autobot-fototree" type="hidden" value="${customer.fotoTree || ''}"/>
                        <p style="color: #718096; font-size: 12px; margin-top: 8px;">
                            ℹ️ Type at least 3 characters to search, then <strong>click on a result</strong> to select it.
                        </p>
                    </div>

                    <div style="display: flex; gap: 12px; margin-top: 32px;">
                        <button id="startBtn" class="ant-btn ant-btn-primary" style="flex: 1; padding: 14px; font-size: 15px; font-weight: 600;">
                        🚀 Start Upload
                        </button>
                        <button id="stopBtn" class="ant-btn" style="flex: 1; padding: 14px; font-size: 15px; font-weight: 600; background: #e53e3e; color: white; border: none; display: none;" disabled>
                            ⏸️ Stop Upload
                        </button>
                    </div>
                </div>

                <div class="panel" style="margin-top: 24px;">
                    <h3 style="margin-bottom: 12px; color: #2d3748; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                        <span>📊</span>
                        <span>Autobot Status</span>
                    </h3>
                    <div id="autobot-logs" style="background: #1a202c; color: #e2e8f0; padding: 16px; border-radius: 8px; max-height: 400px; overflow-y: auto; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.6;"></div>
                </div>
            </div>
            
            <div id="message-container"></div>
        </div>
    `;
}

function initAutobotPage(router) {
    // Initialize shared header navigation
    setRouter(router);
    initSharedHeader(router);

    const { ipcRenderer } = require('electron');
    let selectedFolder = null;
    let isAutobotRunning = false;

    // Folder selection
    const selectFolderBtn = document.getElementById('selectFolder');
    if (selectFolderBtn) {
        selectFolderBtn.addEventListener('click', async () => {
            try {
                const result = await ipcRenderer.invoke('select-folder');

                if (result.success && result.folderPath) {
                    selectedFolder = result.folderPath;
                    const folderPathDiv = document.getElementById('folderPath');
                    const folderName = result.folderPath.split('/').pop() || result.folderPath.split('\\').pop();

                    const fileCount = await ipcRenderer.invoke('count-files', result.folderPath);

                    folderPathDiv.innerHTML = `
                        <div style="margin-top: 8px; padding: 12px; background: white; border-radius: 6px; border: 1px solid #cbd5e0;">
                            <div style="color: #2d3748; font-weight: 600;">📂 ${folderName}</div>
                            <div style="color: #718096; font-size: 13px; margin-top: 4px;">
                                📸 Photos: ${fileCount.photos} | 🎥 Videos: ${fileCount.videos} | 📁 Total: ${fileCount.total}
                            </div>
                        </div>
                    `;

                    logAutobotMessage(`Folder selected: ${result.folderPath}`, 'info');
                    logAutobotMessage(`Files found - Photos: ${fileCount.photos}, Videos: ${fileCount.videos}`, 'info');
                }
            } catch (error) {
                console.error('Error selecting folder:', error);
                showMessage('Error selecting folder', 'error');
            }
        });
    }

    // Password toggle
    const togglePasswordBtn = document.getElementById('toggle-autobot-password');
    const passwordInput = document.getElementById('autobot-password');
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

    // FotoTree search
    const fototreeSearch = document.getElementById('autobot-fototree-search');
    if (fototreeSearch) {
        fototreeSearch.addEventListener('input', () => {
            const fototreeInput = document.getElementById('autobot-fototree');
            if (fototreeInput.value) {
                fototreeInput.value = '';
                fototreeSearch.style.borderColor = '';
                fototreeSearch.style.backgroundColor = '';
            }

            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                const searchTerm = fototreeSearch.value;
                if (searchTerm.length < 3) {
                    const resultsDiv = document.getElementById('autobot-fototree-results');
                    resultsDiv.innerHTML = '';
                    resultsDiv.style.display = 'none';
                    return;
                }

                await searchFotoTree(searchTerm);
            }, 300);
        });
    }

    // Listen for autobot logs
    ipcRenderer.on('autobot-log', (event, { message, type }) => {
        logAutobotMessage(message, type);
    });

    // Start autobot button
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');

    if (startBtn) {
        startBtn.addEventListener('click', async () => {
            // Validate session first
            const isValid = await validateSession();
            if (!isValid) {
                showMessage('Your session has expired. Please login again.', 'error');
                return;
            }

            // Validate inputs
            const customer = JSON.parse(localStorage.getItem('customer') || '{}');
            const password = document.getElementById('autobot-password').value.trim();
            const pricePhoto = document.getElementById('autobot-price-photo').value.trim();
            const priceVideo = document.getElementById('autobot-price-video').value.trim();
            const fototree = document.getElementById('autobot-fototree').value.trim();
            const description = document.getElementById('autobot-description').value.trim();

            if (!selectedFolder) {
                showMessage('Please select a folder first', 'error');
                return;
            }

            if (!password) {
                showMessage('Please enter your Fotoyu password', 'error');
                return;
            }

            if (!pricePhoto) {
                showMessage('Please enter the Photo price (harga)', 'error');
                return;
            }

            if (!priceVideo) {
                showMessage('Please enter the Video price (harga)', 'error');
                return;
            }

            if (!fototree) {
                showMessage('Please select a FotoTree', 'error');
                return;
            }

            // Prepare autobot configuration
            const config = {
                username: customer.username,
                password: password,
                folderPath: selectedFolder,
                pricePhoto: parseInt(pricePhoto, 10),
                priceVideo: parseInt(priceVideo, 10),
                description: description,
                fototree: fototree
            };

            try {
                logAutobotMessage('Starting autobot...', 'info');
                const result = await ipcRenderer.invoke('start-autobot', config);

                if (result.success) {
                    isAutobotRunning = true;
                    startBtn.style.display = 'none';
                    stopBtn.style.display = 'block';
                    stopBtn.disabled = false;
                    showMessage('Autobot started successfully!', 'success');
                } else {
                    showMessage(result.message || 'Failed to start autobot', 'error');
                    logAutobotMessage(result.message || 'Failed to start autobot', 'error');
                }
            } catch (error) {
                console.error('Error starting autobot:', error);
                showMessage('Error starting autobot', 'error');
                logAutobotMessage(`Error: ${error.message}`, 'error');
            }
        });
    }

    // Stop autobot button
    if (stopBtn) {
        stopBtn.addEventListener('click', async () => {
            try {
                logAutobotMessage('Stopping autobot...', 'info');
                const result = await ipcRenderer.invoke('stop-autobot');

                if (result.success) {
                    isAutobotRunning = false;
                    startBtn.style.display = 'block';
                    stopBtn.style.display = 'none';
                    showMessage('Autobot stopped', 'info');
                } else {
                    showMessage(result.message || 'Failed to stop autobot', 'error');
                    logAutobotMessage(result.message || 'Failed to stop autobot', 'error');
                }
            } catch (error) {
                console.error('Error stopping autobot:', error);
                showMessage('Error stopping autobot', 'error');
                logAutobotMessage(`Error: ${error.message}`, 'error');
            }
        });
    }

    async function searchFotoTree(searchTerm) {
        const token = localStorage.getItem('token');
        const resultsDiv = document.getElementById('autobot-fototree-results');

        try {
        const response = await apiFetch(`${API_URL}/customers/fototree/search?q=${encodeURIComponent(searchTerm)}`);

            if (!response.ok) {
                throw new Error('Failed to fetch FotoTree results');
            }

            const data = await response.json();

            if (data.results && data.results.length > 0) {
                resultsDiv.innerHTML = data.results.map(item => `
                    <div class="fototree-item" data-value="${item.value}" style="padding: 10px; cursor: pointer; border-bottom: 1px solid #e2e8f0; transition: background 0.2s;">
                        <div style="font-weight: 500; color: #2d3748;">${item.label}</div>
                        <div style="font-size: 12px; color: #718096;">${item.value}</div>
                    </div>
                `).join('');
                resultsDiv.style.display = 'block';
                resultsDiv.style.border = '1px solid #cbd5e0';
                resultsDiv.style.borderRadius = '4px';
                resultsDiv.style.marginTop = '4px';
                resultsDiv.style.maxHeight = '200px';
                resultsDiv.style.overflowY = 'auto';
                resultsDiv.style.background = 'white';

                // Add click handlers
                const items = resultsDiv.querySelectorAll('.fototree-item');
                items.forEach(item => {
                    item.addEventListener('mouseenter', () => {
                        item.style.background = '#f7fafc';
                    });
                    item.addEventListener('mouseleave', () => {
                        item.style.background = 'white';
                    });
                    item.addEventListener('click', () => {
                        const value = item.getAttribute('data-value');
                        const label = item.querySelector('div').textContent;
                        document.getElementById('autobot-fototree-search').value = label;
                        document.getElementById('autobot-fototree').value = value;
                        resultsDiv.innerHTML = '';
                        resultsDiv.style.display = 'none';

                        // Visual feedback
                        const searchInput = document.getElementById('autobot-fototree-search');
                        searchInput.style.borderColor = '#48bb78';
                        searchInput.style.backgroundColor = '#f0fff4';
                    });
                });
            } else {
                resultsDiv.innerHTML = '<div style="padding: 10px; color: #718096;">No results found</div>';
                resultsDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Error searching FotoTree:', error);
            resultsDiv.innerHTML = '<div style="padding: 10px; color: #e53e3e;">Error loading results</div>';
            resultsDiv.style.display = 'block';
        }
    }

    function logAutobotMessage(message, type = 'info') {
        const logsDiv = document.getElementById('autobot-logs');
        if (!logsDiv) return;

        const timestamp = new Date().toLocaleTimeString();
        const icons = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️'
        };

        const colors = {
            info: '#4299e1',
            success: '#48bb78',
            error: '#e53e3e',
            warning: '#f6e05e'
        };

        const logEntry = document.createElement('div');
        logEntry.style.marginBottom = '8px';
        logEntry.innerHTML = `
            <span style="color: #718096;">[${timestamp}]</span>
            <span style="color: ${colors[type]};">${icons[type]}</span>
            <span style="color: #e2e8f0;">${message}</span>
        `;

        logsDiv.appendChild(logEntry);
        logsDiv.scrollTop = logsDiv.scrollHeight;
    }

    function showMessage(message, type = 'success') {
        const messageContainer = document.getElementById('message-container');
        if (!messageContainer) return;

        const bgColors = {
            success: '#48bb78',
            error: '#e53e3e',
            info: '#4299e1'
        };

        const icons = {
            success: '✓',
            error: '❌',
            info: 'ℹ️'
        };

        messageContainer.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: ${bgColors[type]}; color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); display: flex; align-items: center; gap: 8px; z-index: 1000; animation: slideIn 0.3s ease;">
                <span style="font-size: 16px;">${icons[type]}</span>
                <span style="font-weight: 600;">${message}</span>
            </div>
            <style>
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            </style>
        `;

        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 3000);
    }

    // Initial log
    logAutobotMessage('Autobot page loaded. Configure and start automatic upload.', 'info');
}

module.exports = {
    getAutobotPageTemplate,
    initAutobotPage
};

