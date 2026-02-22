/**
 * Profile Modal - Template and Handlers
 */

const API_URL = process.env.API_URL;

// ============================================================================
// TEMPLATE
// ============================================================================

function getProfileModalTemplate() {
    const customer = JSON.parse(localStorage.getItem('customer') || '{}');

    return `
        <div id="profile-modal" class="modal" style="display: none; z-index: 10000;">
            <div class="modal-content" style="z-index: 10001; position: relative;">
                <div class="modal-header">
                    <h2>Profile Settings</h2>
                    <button class="modal-close" id="close-profile-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="profile-form">
                        <div class="form-group">
                            <label>Username</label>
                            <input type="text" id="profile-username" value="${customer.username || ''}" readonly />
                        </div>
                        
                        <div class="form-group">
                            <label>Price</label>
                            <input type="number" id="profile-price" value="${customer.price || ''}" />
                        </div>
                        
                        <div class="form-group">
                            <label>Description</label>
                            <input type="text" id="profile-description" value="${customer.description || ''}" />
                        </div>
                        
                        <div class="form-group">
                            <label>FotoTree <span style="color: #a0aec0; font-size: 12px;">(optional)</span></label>
                            <div style="position: relative;">
                                <input 
                                    type="text" 
                                    id="profile-fototree-search" 
                                    value="${customer.fotoTree || ''}" 
                                    placeholder="Search FotoTree..." 
                                    autocomplete="off"
                                />
                                <div id="profile-fototree-results" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e2e8f0; border-radius: 4px; max-height: 200px; overflow-y: auto; z-index: 1000; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-top: 4px;"></div>
                            </div>
                            <p style="color: #718096; font-size: 12px; margin-top: 4px;">
                                ℹ️ FotoTree classification for your uploads. Type to search or leave empty.
                            </p>
                        </div>
                        
                        <div class="form-group">
                            <label>Concurrent Tabs <span style="color: #a0aec0; font-size: 12px;">(1-10, higher = faster uploads)</span></label>
                            <input type="number" id="profile-concurrent-tabs" value="${customer.concurrentTabs || 1}" min="1" max="10" />
                            <p style="color: #718096; font-size: 12px; margin-top: 4px;">
                                ℹ️ Number of browser tabs to use for concurrent uploads. Recommended: 2-4 for most users.
                            </p>
                        </div>
                        
                        <div class="form-group">
                            <label>Batch Size <span style="color: #a0aec0; font-size: 12px;">(10-2000, files per batch)</span></label>
                            <input type="number" id="profile-batch-size" value="${customer.batchSize || 10}" min="10" max="2000" />
                            <p style="color: #718096; font-size: 12px; margin-top: 4px;">
                                ℹ️ Number of files to upload per batch. Smaller = safer, Larger = faster. Recommended: 50-100.
                            </p>
                        </div>
                        
                        <div class="form-group">
                            <label>New Password <span style="color: #a0aec0; font-size: 12px;">(leave blank to keep current)</span></label>
                            <input type="password" id="profile-new-password" placeholder="Enter new password" />
                        </div>
                        
                        <div class="form-group">
                            <label>Confirm Password</label>
                            <input type="password" id="profile-confirm-password" placeholder="Confirm new password" />
                        </div>
                        
                        <button type="submit" class="btn-primary">Save Changes</button>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// HANDLERS
// ============================================================================

function openProfileModal(router) {
    const modal = document.getElementById('profile-modal');
    const closeBtn = document.getElementById('close-profile-modal');
    const form = document.getElementById('profile-form');

    modal.style.display = 'flex';

    // Setup FotoTree search
    const fototreeSearchInput = document.getElementById('profile-fototree-search');
    const fototreeResults = document.getElementById('profile-fototree-results');
    let profileFototreeTimeout = null;

    if (fototreeSearchInput) {
        fototreeSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            if (profileFototreeTimeout) {
                clearTimeout(profileFototreeTimeout);
            }

            if (query.length < 2) {
                fototreeResults.style.display = 'none';
                return;
            }

            profileFototreeTimeout = setTimeout(async () => {
                await searchProfileFotoTree(query);
            }, 300);
        });

        // Hide results when clicking outside
        document.addEventListener('click', (e) => {
            if (!fototreeSearchInput.contains(e.target) && !fototreeResults.contains(e.target)) {
                fototreeResults.style.display = 'none';
            }
        });
    }

    // Close modal handler
    const closeModal = () => {
        modal.style.display = 'none';
        if (profileFototreeTimeout) {
            clearTimeout(profileFototreeTimeout);
        }
    };

    closeBtn.onclick = closeModal;

    // Close on outside click
    const outsideClickHandler = (e) => {
        if (e.target === modal) {
            closeModal();
            window.removeEventListener('click', outsideClickHandler);
        }
    };
    window.addEventListener('click', outsideClickHandler);

    // Handle profile update
    form.onsubmit = async (e) => {
        e.preventDefault();
        await updateProfile(router);
    };
}

async function searchProfileFotoTree(query) {
    const resultsDiv = document.getElementById('profile-fototree-results');

    try {
        const response = await fetch(`https://api.fotoyu.com/tree/v1/trees/search?page=1&limit=20&name=${encodeURIComponent(query)}&is_upload=true`);

        if (!response.ok) {
            throw new Error('Failed to fetch FotoTree results');
        }

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
                    const value = item.getAttribute('data-value');
                    document.getElementById('profile-fototree-search').value = value;
                    resultsDiv.style.display = 'none';
                });

                item.addEventListener('mouseenter', (e) => {
                    e.target.style.background = '#f7fafc';
                });

                item.addEventListener('mouseleave', (e) => {
                    e.target.style.background = 'white';
                });
            });
        } else {
            resultsDiv.innerHTML = '<div class="fototree-item" style="padding: 10px; color: #6c757d;">No results found</div>';
            resultsDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching FotoTree:', error);
        resultsDiv.innerHTML = '<div class="fototree-item" style="padding: 10px; color: #ff6b6b;">Error fetching results. Please try again.</div>';
        resultsDiv.style.display = 'block';
    }
}

async function updateProfile(router) {
    const price = document.getElementById('profile-price').value;
    const description = document.getElementById('profile-description').value;
    const fotoTree = document.getElementById('profile-fototree-search').value;
    const concurrentTabs = parseInt(document.getElementById('profile-concurrent-tabs').value) || 1;
    const batchSize = parseInt(document.getElementById('profile-batch-size').value) || 10;
    const newPassword = document.getElementById('profile-new-password').value;
    const confirmPassword = document.getElementById('profile-confirm-password').value;

    // Validate
    if (concurrentTabs < 1 || concurrentTabs > 10) {
        alert('Concurrent Tabs must be between 1 and 10!');
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

    const token = localStorage.getItem('token');
    const customer = JSON.parse(localStorage.getItem('customer') || '{}');

    try {
        const updateData = {
            price: price ? parseFloat(price) : undefined,
            description: description || undefined,
            fotoTree: fotoTree || undefined,
            concurrentTabs: concurrentTabs,
            batchSize: batchSize,
        };

        if (newPassword) {
            updateData.password = newPassword;
        }

        const response = await fetch(`${API_URL}/customers/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Update failed');
        }

        // Update local storage
        const updatedCustomer = {
            ...customer,
            ...data.customer
        };
        localStorage.setItem('customer', JSON.stringify(updatedCustomer));

        alert('Profile updated successfully!');

        // Close modal and refresh page
        document.getElementById('profile-modal').style.display = 'none';
        router.navigate('upload');

    } catch (error) {
        console.error('Profile update error:', error);
        alert(`Failed to update profile: ${error.message}`);
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    getProfileModalTemplate,
    openProfileModal
};

