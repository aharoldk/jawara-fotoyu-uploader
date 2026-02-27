/**
 * Dashboard Page (Upload Page) - Handlers
 */

const API_URL = process.env.API_URL;
const { initSharedHeader } = require('../components/sharedHeader');
const { apiFetch, setRouter, validateSession } = require('../utils/apiFetch');

const dashboardState = {
    selectedFolder: null,
    searchTimeout: null,
    uploadCancelled: false
};

function initDashboardPage(router) {
    setRouter(router);
    dashboardState.selectedFolder = null;
    dashboardState.searchTimeout = null;
    dashboardState.uploadCancelled = false;

    const { ipcRenderer } = require('electron');

    // Listen for bot logs
    ipcRenderer.on('bot-log', (event, { message, type }) => {
        logMessage(message, type);
    });

    // Initialize shared header navigation
    initSharedHeader(router);

    // Initialize all event listeners
    initEventListeners(router);
}

function initEventListeners(router) {


    // Content type change → update harga from the correct price field
    const contentTypeSelect = document.getElementById('contentType');
    const hargaInput = document.getElementById('harga');
    if (contentTypeSelect && hargaInput) {
        contentTypeSelect.addEventListener('change', () => {
            const customer = JSON.parse(localStorage.getItem('customer') || '{}');
            hargaInput.value = contentTypeSelect.value === 'Video'
                ? (customer.priceVideo || '')
                : (customer.pricePhoto || '');
        });
    }

    // Password toggle
    const togglePasswordBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password-fotoyu');
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

    // Folder selection
    document.getElementById('selectFolder').addEventListener('click', () => {
        selectFolder();
    });

    // Upload buttons
    document.getElementById('startBtn').addEventListener('click', () => {
        startUpload(router);
    });

    const stopBtn = document.getElementById('stopBtn');
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            stopUpload();
        });
    }

    // FotoTree search with debouncing
    const fototreeSearch = document.getElementById('fototree-search');
    if (fototreeSearch) {
        fototreeSearch.addEventListener('input', () => {
            const fototreeInput = document.getElementById('fototree');
            if (fototreeInput.value) {
                fototreeInput.value = '';
                fototreeSearch.style.borderColor = '';
                fototreeSearch.style.backgroundColor = '';
            }

            clearTimeout(dashboardState.searchTimeout);
            dashboardState.searchTimeout = setTimeout(async () => {
                const searchTerm = fototreeSearch.value;
                if (searchTerm.length < 3) {
                    const resultsDiv = document.getElementById('fototree-results');
                    resultsDiv.innerHTML = '';
                    resultsDiv.style.display = 'none';
                    return;
                }

                await searchFotoTree(searchTerm);
            }, 300);
        });
    }
}


async function selectFolder() {
    try {
        const { ipcRenderer } = require('electron');
        const result = await ipcRenderer.invoke('select-folder');

        if (result.success && result.folderPath) {
            dashboardState.selectedFolder = result.folderPath;

            const folderPath = document.getElementById('folderPath');
            const folderName = result.folderPath.split('/').pop() || result.folderPath.split('\\').pop();

            const fileCount = await ipcRenderer.invoke('count-files', result.folderPath);

            folderPath.innerHTML = `
                <div style="margin-top: 8px;">
                    <div style="color: #2d3748; font-weight: 500;">Selected: ${folderName}</div>
                    <div style="color: #718096; font-size: 14px; margin-top: 4px;">
                        📸 Photos: ${fileCount.photos} | 🎥 Videos: ${fileCount.videos} | 📁 Total: ${fileCount.total}
                    </div>
                </div>
            `;

            logMessage(`Folder selected: ${result.folderPath}`);
            logMessage(`Files found - Photos: ${fileCount.photos}, Videos: ${fileCount.videos}, Total: ${fileCount.total}`, 'info');
        }
    } catch (error) {
        console.error('Error selecting folder:', error);
        logMessage('Error selecting folder', 'error');
    }
}

async function startUpload(router) {
    const contentType = document.getElementById('contentType').value;
    const batchSize = parseInt(document.getElementById('batchSize').value) || 10;
    const concurrentBot = parseInt(document.getElementById('concurrentBot').value) || 1;
    const harga = document.getElementById('harga').value;
    const deskripsi = document.getElementById('deskripsi').value;
    const fototree = document.getElementById('fototree').value;
    const fotoyuPassword = document.getElementById('password-fotoyu').value;
    const customer = JSON.parse(localStorage.getItem('customer') || '{}');

    // Use the correct price field based on content type
    const resolvedHarga = harga || (contentType === 'Video' ? customer.priceVideo : customer.pricePhoto);

    dashboardState.uploadCancelled = false;

    // Validate session
    logMessage('Validating session...', 'info');
    const isValid = await validateSession();

    if (!isValid) {
        logMessage('Error: Session expired or invalid', 'error');
        alert('Your session has expired. Please login again.');
        router.navigate('login');
        return;
    }

    // Validation
    if (!resolvedHarga) {
        logMessage('Error: Harga is required', 'error');
        alert('Please enter Harga');
        return;
    }

    if (!fotoyuPassword) {
        logMessage('Error: Fotoyu password is required', 'error');
        alert('Please enter your Fotoyu password');
        return;
    }

    if (!fototree) {
        logMessage('Error: FotoTree is required', 'error');
        alert('Please select a FotoTree');
        return;
    }

    const fototreeSearch = document.getElementById('fototree-search').value;
    if (fototreeSearch && !fototree) {
        logMessage('Error: Please select a FotoTree from the dropdown list', 'error');
        alert('Please select a FotoTree from the dropdown list (don\'t just type, you must click on a result)');
        return;
    }

    if (concurrentBot < 1 || concurrentBot > 100) {
        logMessage('Error: Concurrent Bot must be between 1 and 100', 'error');
        alert('Concurrent Bot must be between 1 and 100');
        return;
    }

    if (batchSize < 10 || batchSize > 2000) {
        logMessage('Error: Batch Size must be between 10 and 2000', 'error');
        alert('Batch Size must be between 10 and 2000');
        return;
    }

    const maxBatchSize = contentType === 'Photo' ? 2000 : 50;
    if (batchSize > maxBatchSize) {
        logMessage(`Error: Batch size exceeds maximum for ${contentType}`, 'error');
        alert(`Batch size for ${contentType} cannot exceed ${maxBatchSize}. Please enter a smaller batch size.`);
        return;
    }

    if (!dashboardState.selectedFolder) {
        logMessage('Error: No folder selected', 'error');
        alert('Please select a folder first');
        return;
    }

    logMessage(`Starting upload bot...`);
    logMessage(`Content Type: ${contentType}, Harga: ${resolvedHarga}, Batch Size: ${batchSize}, Concurrent Bot: ${concurrentBot}`);
    logMessage(`Using ${concurrentBot} bot(s) for parallel uploads`, 'info');

    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');

    startBtn.disabled = true;
    startBtn.textContent = 'Uploading...';
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    stopBtn.disabled = false;
    stopBtn.style.opacity = '1';

    // Reset cancellation flag
    dashboardState.uploadCancelled = false;

    try {
        const { ipcRenderer } = require('electron');

        const result = await ipcRenderer.invoke('run-bot', {
            username: customer.username,
            password: fotoyuPassword,
            contentType: contentType,
            folderPath: dashboardState.selectedFolder,
            batchSize: batchSize,
            harga: resolvedHarga,
            deskripsi: deskripsi,
            fototree: fototree,
            concurrentBot: concurrentBot
        });

        if (dashboardState.uploadCancelled || result.cancelled) {
            logMessage('✓ Upload stopped successfully - browser closed', 'warning');
        } else if (result.success) {
            logMessage(`✓ Upload completed successfully! Total: ${result.totalFiles} files`, 'success');
        } else {
            logMessage(`✗ Upload failed: ${result.error}`, 'error');
        }

    } catch (error) {
        console.error('Upload error:', error);
        logMessage(`✗ Upload failed: ${error.message}`, 'error');
    } finally {
        // Reset UI
        dashboardState.uploadCancelled = false;
        startBtn.disabled = false;
        startBtn.textContent = 'Start Upload';
        startBtn.style.display = 'block';
        stopBtn.style.display = 'none';
        stopBtn.disabled = true;
        stopBtn.textContent = 'Stop Upload';
        stopBtn.style.opacity = '1';
    }
}

function stopUpload() {
    dashboardState.uploadCancelled = true;

    const { ipcRenderer } = require('electron');
    ipcRenderer.send('cancel-upload');

    logMessage('⚠️ Stopping upload... (will stop at next safe checkpoint)', 'warning');

    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');

    // Disable stop button to prevent multiple clicks
    stopBtn.disabled = true;
    stopBtn.textContent = 'Stopping...';
    stopBtn.style.opacity = '0.6';

    // Keep start button disabled until upload actually stops
    startBtn.disabled = true;
}

// ============================================================================
// FOTOTREE SEARCH
// ============================================================================

async function searchFotoTree(query) {
    const resultsDiv = document.getElementById('fototree-results');
    const fototreeInput = document.getElementById('fototree');

    if (!resultsDiv) return;

    if (!query || query.length < 3) {
        resultsDiv.innerHTML = '';
        resultsDiv.style.display = 'none';
        return;
    }

    try {
        resultsDiv.style.display = 'block';
        resultsDiv.innerHTML = '<div class="fototree-item" style="color: #adb5bd;">Searching...</div>';

        const response = await fetch(`https://api.fotoyu.com/tree/v1/trees/search?page=1&limit=20&name=${encodeURIComponent(query)}&is_upload=true`);

        if (!response.ok) {
            throw new Error('Failed to fetch FotoTree results');
        }

        const data = await response.json();
        resultsDiv.innerHTML = '';

        const results = data.result || data.data || [];

        if (results.length > 0) {
            results.forEach(item => {
                const resultItem = document.createElement('div');
                resultItem.classList.add('fototree-item');
                resultItem.textContent = item.name;
                resultItem.addEventListener('click', () => {
                    document.getElementById('fototree-search').value = item.name;
                    fototreeInput.value = item.name;
                    resultsDiv.innerHTML = '';
                    resultsDiv.style.display = 'none';

                    // Visual feedback
                    const searchInput = document.getElementById('fototree-search');
                    searchInput.style.borderColor = '#48bb78';
                    searchInput.style.backgroundColor = '#f0fff4';

                    logMessage(`FotoTree selected: ${item.name}`, 'info');
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
}

// ============================================================================
// ============================================================================
// UTILITIES
// ============================================================================

async function logout(router) {
    const token = localStorage.getItem('token');

    if (token) {
        try {
            await apiFetch(`${API_URL}/customers/logout`, {
                method: 'POST',
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    localStorage.removeItem('token');
    localStorage.removeItem('customer');
    router.navigate('login');
}

function logMessage(message, type = 'info') {
    const logsDiv = document.getElementById('logs');
    if (!logsDiv) return;

    const logEntry = document.createElement('div');
    logEntry.classList.add('log-entry', `log-${type}`);

    const timestamp = new Date().toLocaleTimeString();
    logEntry.innerHTML = `<span class="log-time">[${timestamp}]</span> ${message}`;

    logsDiv.appendChild(logEntry);
    logsDiv.scrollTop = logsDiv.scrollHeight;
}

module.exports = {
    initDashboardPage,
    logMessage
};

