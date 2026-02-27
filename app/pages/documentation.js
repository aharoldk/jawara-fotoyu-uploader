/**
 * Setup & Help Page
 */
const { getSharedHeader, initSharedHeader } = require('../components/sharedHeader');

function getSetupPageTemplate() {
    return `
        <div class="autobot-page">
            ${getSharedHeader('documentation')}

            <div class="container">
                <div class="panel">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                        <span style="font-size: 32px;">🎭</span>
                        <div>
                        <h3 style="margin: 0;">Documentation</h3>
                        <p style="margin: 4px 0 0 0; color: #718096; font-size: 14px;">Learn how to use the app and set up your environment</p>
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
        <!-- Uploader Section -->
        <div style="margin-bottom: 32px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
                <span style="font-size: 24px;">📤</span>
                <h3 style="margin: 0; color: #2d3748; font-size: 17px;">Uploader</h3>
            </div>
            <p style="color: #4a5568; font-size: 13px; margin-bottom: 16px; line-height: 1.6;">
                It handles manual uploads. You pick a folder, configure the settings, hit Start — and It does the rest while you pretend to be busy.
            </p>

            <div style="display: grid; gap: 10px;">

                <div style="background: #f7fafc; padding: 14px; border-radius: 6px; border-left: 3px solid #4299e1;">
                    <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 14px;">📁 Select Folder</div>
                    <div style="color: #4a5568; font-size: 13px; line-height: 1.5;">Select the folder containing your photos or videos. It will scan and show you the count of photos, videos, and total files found.</div>
                </div>

                <div style="background: #f7fafc; padding: 14px; border-radius: 6px; border-left: 3px solid #e53e3e;">
                    <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 14px;">🔐 Password Fotoyu <span style="background: #e53e3e; color: white; padding: 1px 6px; border-radius: 3px; font-size: 10px; margin-left: 6px;">REQUIRED</span></div>
                    <div style="color: #4a5568; font-size: 13px; line-height: 1.5;">Your Fotoyu account password for auto-login. <strong>Not stored anywhere</strong> — only used during the upload session.</div>
                </div>

                <div style="background: #f7fafc; padding: 14px; border-radius: 6px; border-left: 3px solid #667eea;">
                    <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 14px;">🎞️ Content Type</div>
                    <div style="color: #4a5568; font-size: 13px; line-height: 1.5;">Choose <strong>Photo</strong> or <strong>Video</strong>. Switching this will automatically update the <em>Harga</em> field to your saved price for that content type (from Profile settings).</div>
                </div>

                <div style="background: #f7fafc; padding: 14px; border-radius: 6px; border-left: 3px solid #48bb78;">
                    <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 14px;">⚡ Concurrent Bot (1–100)</div>
                    <div style="color: #4a5568; font-size: 13px; line-height: 1.5;">Number of browser bots running in parallel. Each bot logs in independently and uploads its own batch. <strong>Recommended: 1–3 bots</strong> to avoid overloading your machine.</div>
                </div>

                <div style="background: #f7fafc; padding: 14px; border-radius: 6px; border-left: 3px solid #ed8936;">
                    <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 14px;">📦 Batch Size (10–2000)</div>
                    <div style="color: #4a5568; font-size: 13px; line-height: 1.5;">Number of files each bot processes per batch. <strong>Photos:</strong> 10–50 recommended. <strong>Videos:</strong> 5–10 recommended. Larger batches = fewer logins but more memory.</div>
                </div>

                <div style="background: #f7fafc; padding: 14px; border-radius: 6px; border-left: 3px solid #e53e3e;">
                    <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 14px;">💰 Harga <span style="background: #e53e3e; color: white; padding: 1px 6px; border-radius: 3px; font-size: 10px; margin-left: 6px;">REQUIRED</span></div>
                    <div style="color: #4a5568; font-size: 13px; line-height: 1.5;">Price for each file (in Rupiah). Auto-filled based on your saved <strong>Price Photo / Price Video</strong> in Profile. You can override it here before starting.</div>
                </div>

                <div style="background: #f7fafc; padding: 14px; border-radius: 6px; border-left: 3px solid #e53e3e;">
                    <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 14px;">🌲 FotoTree <span style="background: #e53e3e; color: white; padding: 1px 6px; border-radius: 3px; font-size: 10px; margin-left: 6px;">REQUIRED</span></div>
                    <div style="color: #4a5568; font-size: 13px; line-height: 1.5;">The FotoTree destination for your uploads. Type at least 3 characters to search, then <strong>click a result</strong> to select it. Typing alone won't work — you must click.</div>
                </div>

                <div style="background: #f7fafc; padding: 14px; border-radius: 6px; border-left: 3px solid #a0aec0;">
                    <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 14px;">📝 Deskripsi <span style="color: #a0aec0; font-size: 12px; font-weight: 400;">(optional)</span></div>
                    <div style="color: #4a5568; font-size: 13px; line-height: 1.5;">A description that will be attached to every uploaded file in this session.</div>
                </div>
            </div>
        </div>

        <!-- Autobot Section -->
        <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
                <span style="font-size: 24px;">🤖</span>
                <h3 style="margin: 0; color: #2d3748; font-size: 17px;">Alfred — Automatic Watcher <span style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; vertical-align: middle; margin-left: 6px;">PRO</span></h3>
            </div>
            <p style="color: #4a5568; font-size: 13px; margin-bottom: 16px; line-height: 1.6;">
                Alfred watches your selected folder and automatically uploads new files the moment they appear — no button clicking required. Set it and forget it. <strong>Available for Pro subscribers only.</strong>
            </p>

            <div style="display: grid; gap: 10px;">

                <div style="background: #f7fafc; padding: 14px; border-radius: 6px; border-left: 3px solid #4299e1;">
                    <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 14px;">📁 Select Folder</div>
                    <div style="color: #4a5568; font-size: 13px; line-height: 1.5;">The folder Autobot will monitor. Any new photo or video that appears in this folder will be automatically picked up and uploaded.</div>
                </div>

                <div style="background: #f7fafc; padding: 14px; border-radius: 6px; border-left: 3px solid #e53e3e;">
                    <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 14px;">🔐 Password Fotoyu <span style="background: #e53e3e; color: white; padding: 1px 6px; border-radius: 3px; font-size: 10px; margin-left: 6px;">REQUIRED</span></div>
                    <div style="color: #4a5568; font-size: 13px; line-height: 1.5;">Used by Autobot to log into Fotoyu for each upload cycle. Not stored.</div>
                </div>

                <div style="background: #f7fafc; padding: 14px; border-radius: 6px; border-left: 3px solid #e53e3e;">
                    <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 14px;">💰 Harga Foto & Harga Video <span style="background: #e53e3e; color: white; padding: 1px 6px; border-radius: 3px; font-size: 10px; margin-left: 6px;">REQUIRED</span></div>
                    <div style="color: #4a5568; font-size: 13px; line-height: 1.5;">Set separate prices for photos and videos. Autobot automatically detects the file type and applies the correct price. Auto-filled from your Profile settings.</div>
                </div>

                <div style="background: #f7fafc; padding: 14px; border-radius: 6px; border-left: 3px solid #e53e3e;">
                    <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 14px;">🌲 FotoTree <span style="background: #e53e3e; color: white; padding: 1px 6px; border-radius: 3px; font-size: 10px; margin-left: 6px;">REQUIRED</span></div>
                    <div style="color: #4a5568; font-size: 13px; line-height: 1.5;">The FotoTree all files will be uploaded to. Type to search and click a result to select. Autobot uses this same FotoTree for all upload cycles.</div>
                </div>

                <div style="background: #f7fafc; padding: 14px; border-radius: 6px; border-left: 3px solid #a0aec0;">
                    <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px; font-size: 14px;">📝 Deskripsi <span style="color: #a0aec0; font-size: 12px; font-weight: 400;">(optional)</span></div>
                    <div style="color: #4a5568; font-size: 13px; line-height: 1.5;">Description attached to every file Autobot uploads.</div>
                </div>

                <div style="background: #fff3cd; padding: 14px; border-radius: 6px; border-left: 3px solid #ed8936;">
                    <div style="font-weight: 600; color: #2d3748; margin-bottom: 6px; font-size: 14px;">⚙️ How Alfred Works</div>
                    <div style="color: #4a5568; font-size: 13px; line-height: 1.8;">
                        1. Click <strong>Start Upload</strong> — Alfred begins monitoring the folder<br>
                        2. It periodically scans for new files not yet uploaded<br>
                        3. New files are uploaded automatically (photos and videos separately)<br>
                        4. Click <strong>Stop Upload</strong> to stop monitoring at any time
                    </div>
                </div>
            </div>
        </div>

        <!-- Tips -->
        <div style="margin-bottom: 16px;">
            <h3 style="color: #2d3748; margin-bottom: 16px; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">💡 Tips & Best Practices</h3>
            <div style="display: grid; gap: 10px;">
                <div style="background: #edf2f7; padding: 12px; border-radius: 6px; border-left: 3px solid #48bb78;">
                    <div style="color: #2d3748; font-size: 13px;"><strong>✓ Save defaults in Profile:</strong> Set your Price Photo, Price Video, FotoTree, Concurrent Bot, and Batch Size in the Profile page so they auto-fill every time.</div>
                </div>
                <div style="background: #edf2f7; padding: 12px; border-radius: 6px; border-left: 3px solid #48bb78;">
                    <div style="color: #2d3748; font-size: 13px;"><strong>✓ Start small:</strong> Run with 1 bot and a small batch first to verify everything works before scaling up.</div>
                </div>
                <div style="background: #edf2f7; padding: 12px; border-radius: 6px; border-left: 3px solid #48bb78;">
                    <div style="color: #2d3748; font-size: 13px;"><strong>✓ Use Autobot for ongoing shoots:</strong> Leave Autobot running while you shoot — it'll upload new files automatically as you copy them to the folder.</div>
                </div>
                <div style="background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 3px solid #ed8936;">
                    <div style="color: #2d3748; font-size: 13px;"><strong>⚠️ Performance:</strong> More concurrent bots = faster uploads but higher CPU & memory usage. Don't exceed what your machine can handle.</div>
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

