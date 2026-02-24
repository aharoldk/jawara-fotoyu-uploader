/**
 * Dashboard Page (Upload Page) - Template Only
 * Note: Profile and Setup modals are in separate files
 */
const { getSharedHeader } = require('../components/sharedHeader');

function getDashboardPageTemplate() {
    const customer = JSON.parse(localStorage.getItem('customer') || '{}');

    return `
        <div class="upload-page">
            ${getSharedHeader('upload')}
            
            <!-- Modals will be injected here -->
            <div id="modal-container"></div>
            
            ${getUploadFormTemplate(customer)}
        </div>
    `;
}

function getUploadFormTemplate(customer) {
    return `
        <div class="container">
            <div class="panel">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                    <span style="font-size: 32px;">📤</span>
                    <div>
                        <h2 style="margin: 0; color: #2d3748; font-size: 20px; font-weight: 600;">Upload Photos</h2>
                        <p style="margin: 4px 0 0 0; color: #718096; font-size: 14px;">Upload your photos to Fotoyu manually</p>
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
                            id="password-fotoyu" 
                            class="ant-input" 
                            placeholder="Enter your Fotoyu password"
                            required
                            style="padding-right: 40px;"
                        >
                        <button id="toggle-password" type="button" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 18px; color: #718096; padding: 4px 8px;">👁️</button>
                    </div>
                    <p style="color: #718096; font-size: 12px; margin-top: 8px;">This password is used to login to Fotoyu automatically. It's not stored.</p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                    <div class="ant-form-item">
                        <label class="ant-form-item-label">Content Type</label>
                        <select id="contentType" class="ant-input" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 14px;">
                            <option value="Photo">Photo</option>
                            <option value="Video">Video</option>
                        </select>
                    </div>

                    <div class="ant-form-item">
                        <label class="ant-form-item-label">Concurrent Tabs <span style="color: #a0aec0; font-size: 12px;">(1-100, parallel uploads)</span></label>
                        <input 
                            type="number" 
                            id="concurrentTabs" 
                            class="ant-input" 
                            value="${customer.concurrentTabs || 1}" 
                            min="1" 
                            max="100"
                        >
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                    <div class="ant-form-item">
                        <label class="ant-form-item-label">Batch Size <span style="color: #a0aec0; font-size: 12px;">(10-2000, files per batch)</span></label>
                        <input 
                            type="number" 
                            id="batchSize" 
                            class="ant-input" 
                            value="${customer.batchSize || 10}" 
                            min="10" 
                            max="2000"
                        >
                    </div>

                    <div class="ant-form-item">
                        <label class="ant-form-item-label">Harga <span style="color: #e53e3e;">*</span></label>
                        <input 
                            type="number" 
                            id="harga" 
                            class="ant-input" 
                            placeholder="Enter harga" 
                            value="${customer.price || ''}" 
                            required
                        >
                    </div>
                </div>

                <div class="ant-form-item" style="margin-bottom: 20px;">
                    <label class="ant-form-item-label">Deskripsi <span style="color: #a0aec0; font-size: 12px;">(optional)</span></label>
                    <input 
                        type="text" 
                        id="deskripsi" 
                        class="ant-input" 
                        placeholder="Enter deskripsi" 
                        value="${customer.description || ''}"
                    >
                </div>

                <div class="ant-form-item" style="margin-bottom: 20px;">
                    <label class="ant-form-item-label">FotoTree <span style="color: #e53e3e;">*</span></label>
                    <input 
                        id="fototree-search" 
                        type="text" 
                        class="ant-input" 
                        placeholder="Type to search FotoTree..." 
                        value="${customer.fotoTree || ''}"
                    />
                    <div id="fototree-results"></div>
                    <input id="fototree" type="hidden" value="${customer.fotoTree || ''}"/>
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
                    <span>Logs</span>
                </h3>
                <div id="logs" style="background: #1a202c; color: #e2e8f0; padding: 16px; border-radius: 8px; max-height: 400px; overflow-y: auto; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.6;"></div>
            </div>
        </div>
    `;
}

module.exports = {
    getDashboardPageTemplate
};

