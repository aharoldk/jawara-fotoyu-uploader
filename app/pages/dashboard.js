/**
 * Dashboard Page (Upload Page) - Template Only
 * Note: Profile and Setup modals are in separate files
 */

// ============================================================================
// TEMPLATE
// ============================================================================

function getDashboardPageTemplate() {
    const customer = JSON.parse(localStorage.getItem('customer') || '{}');
    const version = require('../package.json').version;

    return `
        <div class="upload-page">
            ${getHeaderTemplate(customer, version)}
            
            <!-- Modals will be injected here -->
            <div id="modal-container"></div>
            
            ${getUploadFormTemplate(customer)}
        </div>
    `;
}

function getHeaderTemplate(customer, version) {
    return `
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
    `;
}

function getUploadFormTemplate(customer) {
    return `
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
    `;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    getDashboardPageTemplate,
    getHeaderTemplate,
    getUploadFormTemplate
};

