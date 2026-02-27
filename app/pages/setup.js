/**
 * Setup & Help Page
 */
const { getSharedHeader, initSharedHeader } = require('../components/sharedHeader');

function getSetupPageTemplate() {
    return `
        <div class="autobot-page">
            ${getSharedHeader('setup')}

            <div class="container">
                <div class="panel">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                        <span style="font-size: 32px;">🎭</span>
                        <div>
                            <h3 style="margin: 0;">Setup & Help Guide</h3>
                            <p style="margin: 4px 0 0 0; color: #718096; font-size: 14px;">Installation guide and how to use the app</p>
                        </div>
                    </div>

                    <!-- Tabs -->
                    <div style="display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 0;">
                        <button class="tab-btn active" data-tab="help" style="padding: 12px 24px; background: none; border: none; cursor: pointer; font-size: 15px; font-weight: 600; color: #667eea; border-bottom: 3px solid #667eea; margin-bottom: -2px; transition: all 0.2s;">
                            📚 How to Use
                        </button>
                        <button class="tab-btn" data-tab="setup" style="padding: 12px 24px; background: none; border: none; cursor: pointer; font-size: 15px; font-weight: 600; color: #718096; border-bottom: 3px solid transparent; margin-bottom: -2px; transition: all 0.2s;">
                            🎭 Playwright Setup
                        </button>
                    </div>

                    <!-- Help Tab Content -->
                    <div id="help-tab" class="tab-content" style="display: block;">
                        ${getHelpContent()}
                    </div>

                    <!-- Setup Tab Content -->
                    <div id="setup-tab" class="tab-content" style="display: none;">
                        ${getSetupContent()}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getHelpContent() {
    return `
        <!-- Quick Start -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin-bottom: 24px; color: white;">
            <h3 style="margin: 0 0 12px 0; font-size: 18px;">⚡ Quick Start</h3>
            <ol style="margin: 0; padding-left: 20px; line-height: 1.8;">
                <li><strong>First Time?</strong> Click the <span style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px;">🎭 Playwright Setup</span> tab above to install browser automation</li>
                <li>Enter your <strong>Fotoyu password</strong> (required for auto-login)</li>
                <li><strong>Select folder</strong> containing your photos/videos</li>
                <li>Fill in <strong>Price</strong> and <strong>FotoTree</strong> (required fields)</li>
                <li>Click <strong>Start Upload</strong> and let the bot do the work!</li>
            </ol>
        </div>

        <!-- Field Explanations -->
        <div style="margin-bottom: 24px;">
            <h3 style="color: #2d3748; margin-bottom: 16px; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
                📝 Field Explanations
            </h3>

            <div style="display: grid; gap: 12px;">
                <div style="background: #f7fafc; padding: 14px; border-radius: 6px; border-left: 3px solid #e53e3e;">
                    <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 14px;">🔐 Password Fotoyu <span style="background: #e53e3e; color: white; padding: 1px 6px; border-radius: 3px; font-size: 10px; margin-left: 6px;">REQUIRED</span></div>
                    <div style="color: #4a5568; font-size: 13px; line-height: 1.5;">Your Fotoyu account password. The bot uses this to login automatically. <strong>Note:</strong> Password is NOT stored.</div>
                </div>

                <div style="background: #f7fafc; padding: 14px; border-radius: 6px; border-left: 3px solid #4299e1;">
                    <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 14px;">📁 Select Folder</div>
                    <div style="color: #4a5568; font-size: 13px; line-height: 1.5;">Choose the folder containing your photos or videos to upload.</div>
                </div>

                <div style="background: #f7fafc; padding: 14px; border-radius: 6px; border-left: 3px solid #48bb78;">
                    <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 14px;">⚡ Concurrent Bot (1-100)</div>
                    <div style="color: #4a5568; font-size: 13px; line-height: 1.5;">Number of browser bots for parallel uploads. <strong>Tip:</strong> Start with 1-2 bots.</div>
                </div>

                <div style="background: #f7fafc; padding: 14px; border-radius: 6px; border-left: 3px solid #ed8936;">
                    <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 14px;">📦 Batch Size (10-2000)</div>
                    <div style="color: #4a5568; font-size: 13px; line-height: 1.5;"><strong>Recommended:</strong> 10-50 for photos, 5-10 for videos.</div>
                </div>

                <div style="background: #f7fafc; padding: 14px; border-radius: 6px; border-left: 3px solid #e53e3e;">
                    <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 14px;">🌲 FotoTree <span style="background: #e53e3e; color: white; padding: 1px 6px; border-radius: 3px; font-size: 10px; margin-left: 6px;">REQUIRED</span></div>
                    <div style="color: #4a5568; font-size: 13px; line-height: 1.5;">Type at least 3 characters to search, then <strong>click on a result</strong> to select it.</div>
                </div>
            </div>
        </div>

        <!-- Tips -->
        <div style="margin-bottom: 16px;">
            <h3 style="color: #2d3748; margin-bottom: 16px; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">💡 Tips & Best Practices</h3>

            <div style="display: grid; gap: 10px;">
                <div style="background: #edf2f7; padding: 12px; border-radius: 6px; border-left: 3px solid #48bb78;">
                    <div style="color: #2d3748; font-size: 13px;"><strong>✓ For Photos:</strong> Use batch size 10-50 and 2-3 concurrent bots for optimal speed</div>
                </div>
                <div style="background: #edf2f7; padding: 12px; border-radius: 6px; border-left: 3px solid #48bb78;">
                    <div style="color: #2d3748; font-size: 13px;"><strong>✓ For Videos:</strong> Use batch size 5-10 and 1-2 concurrent bots</div>
                </div>
                <div style="background: #edf2f7; padding: 12px; border-radius: 6px; border-left: 3px solid #48bb78;">
                    <div style="color: #2d3748; font-size: 13px;"><strong>✓ Save Settings:</strong> Use <strong>Profile</strong> to save your common settings</div>
                </div>
                <div style="background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 3px solid #ed8936;">
                    <div style="color: #2d3748; font-size: 13px;"><strong>⚠️ Performance:</strong> More bots = faster but more CPU/memory usage</div>
                </div>
            </div>
        </div>
    `;
}

function getSetupContent() {
    return `
        <!-- Important Notice -->
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 16px; border-radius: 8px; margin-bottom: 24px; color: white;">
            <h3 style="margin: 0 0 12px 0; font-size: 18px; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 24px;">⚠️</span>
                <span>First Time Setup Required!</span>
            </h3>
            <p style="margin: 0; line-height: 1.6; font-size: 14px;">
                Before using this app, you <strong>MUST</strong> install Playwright browsers. This is a <strong>ONE-TIME</strong> setup that takes 2-5 minutes.
            </p>
        </div>

        <div style="background: #f0fdf4; border: 2px solid #86efac; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #166534; display: flex; align-items: center; gap: 8px;">
                <span>🚀</span>
                <span>Quick Start - Complete Setup (Recommended)</span>
            </h3>
            <p style="color: #166534; margin-bottom: 12px; font-size: 14px;">
                <strong>Follow these steps to install Node.js with NVM (curl method):</strong>
            </p>
            <ol style="margin: 0 0 12px 0; padding-left: 20px; color: #166534; line-height: 1.8;">
                <li><strong>Open Terminal</strong> (press Cmd+Space, type "Terminal")</li>
                <li><strong>Install NVM (Node Version Manager):</strong></li>
            </ol>
            <div style="background: #1e293b; color: #f1f5f9; padding: 16px; border-radius: 6px; font-family: monospace; font-size: 13px; position: relative; margin: 12px 0; overflow-x: auto;">
                curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
                <button onclick="copyCode(this, 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash')" style="position: absolute; right: 8px; top: 8px; background: #4a5568; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">📋 Copy</button>
            </div>
            <ol start="3" style="margin: 0; padding-left: 20px; color: #166534; line-height: 1.8;">
                <li><strong>Close and reopen Terminal</strong>, then install Node.js 20:</li>
            </ol>
            <div style="background: #1e293b; color: #f1f5f9; padding: 16px; border-radius: 6px; font-family: monospace; font-size: 14px; position: relative; margin: 12px 0; overflow-x: auto;">
                nvm install 20
                <button onclick="copyCode(this, 'nvm install 20')" style="position: absolute; right: 8px; top: 8px; background: #4a5568; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">📋 Copy</button>
            </div>
            <ol start="4" style="margin: 0; padding-left: 20px; color: #166534; line-height: 1.8;">
                <li><strong>Install Playwright browsers:</strong></li>
            </ol>
            <div style="background: #1e293b; color: #f1f5f9; padding: 16px; border-radius: 6px; font-family: monospace; font-size: 14px; position: relative; margin: 12px 0; overflow-x: auto;">
                npx playwright@1.57.0 install
                <button onclick="copyCode(this, 'npx playwright@1.57.0 install')" style="position: absolute; right: 8px; top: 8px; background: #4a5568; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">📋 Copy</button>
            </div>
            <ol start="5" style="margin: 0; padding-left: 20px; color: #166534; line-height: 1.8;">
                <li><strong>Wait 2-5 minutes</strong> for download (~150MB)</li>
                <li><strong>Restart the app</strong> when done</li>
            </ol>
            <div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 12px; border-radius: 4px; margin-top: 12px;">
                <p style="color: #166534; font-size: 13px; margin: 0;">
                    <strong>✨ Why NVM?</strong> NVM allows you to easily manage Node.js versions and is the recommended approach for developers.
                </p>
            </div>
        </div>

        <!-- Alternative: If Node.js Already Installed -->
        <div style="background: #eff6ff; border: 2px solid #93c5fd; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1e40af; display: flex; align-items: center; gap: 8px;">
                <span>⚡</span>
                <span>Already Have Node.js? Just Install Playwright</span>
            </h3>
            <p style="color: #1e40af; margin-bottom: 12px; font-size: 14px;">
                If Node.js is already installed, just run this command:
            </p>
            <div style="background: #1e293b; color: #f1f5f9; padding: 16px; border-radius: 6px; font-family: monospace; font-size: 13px; position: relative; margin: 12px 0; overflow-x: auto;">
                npx playwright@1.57.0 install
                <button onclick="copyCode(this, 'npx playwright@1.57.0 install')" style="position: absolute; right: 8px; top: 8px; background: #4a5568; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">📋 Copy</button>
            </div>
        </div>
    `;
}

function initSetupPage(router) {
    initSharedHeader(router);

    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');

            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.color = '#718096';
                btn.style.borderBottomColor = 'transparent';
            });
            button.classList.add('active');
            button.style.color = '#667eea';
            button.style.borderBottomColor = '#667eea';

            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            document.getElementById(`${tabName}-tab`).style.display = 'block';
        });
    });
}

module.exports = { getSetupPageTemplate, initSetupPage };

