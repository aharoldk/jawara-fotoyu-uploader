/**
 * Setup Modal (Playwright Installation Guide) - Template and Handlers
 */

// ============================================================================
// TEMPLATE
// ============================================================================

function getSetupModalTemplate() {
    return `
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
    `;
}

// ============================================================================
// HANDLERS
// ============================================================================

function openSetupModal() {
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
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    getSetupModalTemplate,
    openSetupModal
};

