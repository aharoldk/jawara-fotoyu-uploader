/**
 * Profile Settings Page
 */
const { getSharedHeader, initSharedHeader } = require('../components/sharedHeader');
const { apiFetch, setRouter, validateSession } = require('../utils/apiFetch');

const API_URL = process.env.API_URL;

// ============================================================================
// TEMPLATE
// ============================================================================

function getProfilePageTemplate() {
    const customer = JSON.parse(localStorage.getItem('customer') || '{}');

    return `
        <div class="autobot-page">
            ${getSharedHeader('profile')}

            <div class="container">
                <div class="panel">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                        <span style="font-size: 32px;">👤</span>
                        <div>
                            <h3 style="margin: 0;">Profile Settings</h3>
                            <p style="margin: 4px 0 0 0; color: #718096; font-size: 14px;">Manage your account preferences</p>
                        </div>
                    </div>

                    <form id="profile-form">
                        <div class="ant-form-item" style="margin-bottom: 20px;">
                            <label class="ant-form-item-label">Username</label>
                            <input class="ant-input" type="text" id="profile-username" value="${customer.username || ''}" readonly style="background-color: #f7fafc; cursor: not-allowed;" />
                        </div>

                        <div class="ant-form-item" style="margin-bottom: 20px;">
                            <label class="ant-form-item-label">Price Photo</label>
                            <input class="ant-input" type="number" id="profile-price-photo" value="${customer.pricePhoto || ''}" placeholder="Enter photo price" />
                        </div>

                        <div class="ant-form-item" style="margin-bottom: 20px;">
                            <label class="ant-form-item-label">Price Video</label>
                            <input class="ant-input" type="number" id="profile-price-video" value="${customer.priceVideo || ''}" placeholder="Enter video price" />
                        </div>

                        <div class="ant-form-item" style="margin-bottom: 20px;">
                            <label class="ant-form-item-label">Description</label>
                            <input class="ant-input" type="text" id="profile-description" value="${customer.description || ''}" placeholder="Enter description" />
                        </div>

                        <div class="ant-form-item" style="margin-bottom: 20px;">
                            <label class="ant-form-item-label">FotoTree <span style="color: #a0aec0; font-size: 12px;">(optional)</span></label>
                            <div style="position: relative;">
                                <input
                                    class="ant-input"
                                    type="text"
                                    id="profile-fototree-search"
                                    value="${customer.fotoTree || ''}"
                                    placeholder="Type to search FotoTree..."
                                    autocomplete="off"
                                />
                                <div id="profile-fototree-results" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e2e8f0; border-radius: 4px; max-height: 200px; overflow-y: auto; z-index: 1000; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-top: 4px;"></div>
                            </div>
                            <p style="color: #718096; font-size: 12px; margin-top: 4px;">
                                ℹ️ Type at least 2 characters to search, then <strong>click on a result</strong> to select it.
                            </p>
                        </div>

                        <div class="ant-form-item" style="margin-bottom: 20px;">
                            <label class="ant-form-item-label">Concurrent Bot <span style="color: #a0aec0; font-size: 12px;">(1-100, higher = faster uploads)</span></label>
                            <input class="ant-input" type="number" id="profile-concurrent-bot" value="${customer.concurrentBot || 1}" min="1" max="100" />
                            <p style="color: #718096; font-size: 12px; margin-top: 4px;">
                                ℹ️ Number of browser bots to use for concurrent uploads. Recommended: 2-4 for most users.
                            </p>
                        </div>

                        <div class="ant-form-item" style="margin-bottom: 20px;">
                            <label class="ant-form-item-label">Batch Size <span style="color: #a0aec0; font-size: 12px;">(10-2000, files per batch)</span></label>
                            <input class="ant-input" type="number" id="profile-batch-size" value="${customer.batchSize || 10}" min="10" max="2000" />
                            <p style="color: #718096; font-size: 12px; margin-top: 4px;">
                                ℹ️ Number of files to upload per batch. Recommended: 50-100.
                            </p>
                        </div>

                        <div class="ant-form-item" style="margin-bottom: 20px;">
                            <label class="ant-form-item-label">New Password <span style="color: #a0aec0; font-size: 12px;">(leave blank to keep current)</span></label>
                            <div style="position: relative;">
                                <input class="ant-input" type="password" id="profile-new-password" placeholder="Enter new password" style="padding-right: 40px;" />
                                <button type="button" id="toggle-new-password" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 18px; color: #718096; padding: 4px 8px;">👁️</button>
                            </div>
                        </div>

                        <div class="ant-form-item" style="margin-bottom: 28px;">
                            <label class="ant-form-item-label">Confirm Password</label>
                            <div style="position: relative;">
                                <input class="ant-input" type="password" id="profile-confirm-password" placeholder="Confirm new password" style="padding-right: 40px;" />
                                <button type="button" id="toggle-confirm-password" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 18px; color: #718096; padding: 4px 8px;">👁️</button>
                            </div>
                        </div>

                        <div style="display: flex; gap: 12px;">
                            <button type="submit" class="ant-btn ant-btn-primary" style="flex: 1; padding: 12px; font-size: 15px; font-weight: 600;">
                                💾 Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
    `;
}

async function searchFotoTree(query) {
    const resultsDiv = document.getElementById('profile-fototree-results');
    try {
        const response = await fetch(`https://api.fotoyu.com/tree/v1/trees/search?page=1&limit=20&name=${encodeURIComponent(query)}&is_upload=true`);
        if (!response.ok) throw new Error('Failed to fetch FotoTree results');

        const data = await response.json();
        const results = data.result || data.data || [];

        if (results.length > 0) {
            resultsDiv.innerHTML = results.map(item => `
                <div class="fototree-item" data-value="${item.name}" style="padding: 10px; cursor: pointer; border-bottom: 1px solid #e2e8f0;">
                    ${item.name}
                </div>
            `).join('');
            resultsDiv.style.display = 'block';

            resultsDiv.querySelectorAll('.fototree-item').forEach(item => {
                item.addEventListener('click', () => {
                    document.getElementById('profile-fototree-search').value = item.getAttribute('data-value');
                    resultsDiv.style.display = 'none';
                });
                item.addEventListener('mouseenter', e => e.target.style.background = '#f7fafc');
                item.addEventListener('mouseleave', e => e.target.style.background = 'white');
            });
        } else {
            resultsDiv.innerHTML = '<div style="padding: 10px; color: #6c757d;">No results found</div>';
            resultsDiv.style.display = 'block';
        }
    } catch (error) {
        resultsDiv.innerHTML = '<div style="padding: 10px; color: #ff6b6b;">Error fetching results. Please try again.</div>';
        resultsDiv.style.display = 'block';
    }
}

async function saveProfile(router) {
    // Validate session first
    const isValid = await validateSession();
    if (!isValid) {
        alert('Your session has expired. Please login again.');
        return;
    }

    const pricePhoto = document.getElementById('profile-price-photo').value;
    const priceVideo = document.getElementById('profile-price-video').value;
    const description = document.getElementById('profile-description').value;
    const fotoTree = document.getElementById('profile-fototree-search').value;
    const concurrentBot = parseInt(document.getElementById('profile-concurrent-bot').value) || 1;
    const batchSize = parseInt(document.getElementById('profile-batch-size').value) || 10;
    const newPassword = document.getElementById('profile-new-password').value;
    const confirmPassword = document.getElementById('profile-confirm-password').value;

    if (concurrentBot < 1 || concurrentBot > 100) {
        alert('Concurrent Bot must be between 1 and 100!');
        return;
    }

    if (batchSize < 10 || batchSize > 2000) {
        alert('Batch Size must be between 10 and 2000!');
        return;
    }

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

    const customer = JSON.parse(localStorage.getItem('customer') || '{}');

    try {
        const updateData = {
            pricePhoto: pricePhoto ? parseFloat(pricePhoto) : undefined,
            priceVideo: priceVideo ? parseFloat(priceVideo) : undefined,
            description: description || undefined,
            fotoTree: fotoTree || undefined,
            concurrentBot: concurrentBot,
            batchSize: batchSize,
        };

        if (newPassword) {
            updateData.password = newPassword;
        }

        const response = await apiFetch(`${API_URL}/customers/profile`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Update failed');
        }

        localStorage.setItem('customer', JSON.stringify({ ...customer, ...data.customer }));

        alert('Profile updated successfully!');
        router.navigate('upload');

    } catch (error) {
        // 401 is handled by apiFetch (navigates to login) — don't show alert for it
        if (error.message === 'Session expired. Please login again.') return;
        console.error('Profile update error:', error);
        alert(`Failed to update profile: ${error.message}`);
    }
}

function initProfilePage(router) {
    setRouter(router);
    initSharedHeader(router);


    // Password visibility toggles
    [['toggle-new-password', 'profile-new-password'], ['toggle-confirm-password', 'profile-confirm-password']].forEach(([btnId, inputId]) => {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        if (btn && input) {
            btn.addEventListener('click', () => {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                btn.textContent = isPassword ? '🙈' : '👁️';
            });
        }
    });

    // FotoTree search
    const searchInput = document.getElementById('profile-fototree-search');
    const resultsDiv = document.getElementById('profile-fototree-results');
    let searchTimeout = null;

    if (searchInput) {
        searchInput.addEventListener('input', e => {
            const query = e.target.value.trim();
            clearTimeout(searchTimeout);
            if (query.length < 2) {
                resultsDiv.style.display = 'none';
                return;
            }
            searchTimeout = setTimeout(() => searchFotoTree(query), 300);
        });

        document.addEventListener('click', e => {
            if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
                resultsDiv.style.display = 'none';
            }
        });
    }

    // Form submit
    const form = document.getElementById('profile-form');
    if (form) {
        form.addEventListener('submit', async e => {
            e.preventDefault();
            await saveProfile(router);
        });
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = { getProfilePageTemplate, initProfilePage };

