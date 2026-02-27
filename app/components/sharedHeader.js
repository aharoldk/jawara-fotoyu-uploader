/**
 * Shared Header Component
 * This header is consistent across all pages with navigation menu
 */

const { apiFetch, setRouter } = require('../utils/apiFetch');

function getSharedHeader(currentPage = 'upload') {
    const customer = JSON.parse(localStorage.getItem('customer') || '{}');
    const version = require('../package.json').version;
    const isProUser = customer.subscriptionType === 'Pro';

    return `
        <div class="header">
            <div style="display: flex; align-items: center; gap: 16px;">
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <h1 style="margin: 0; line-height: 1.2;">Fotoyu Bot Uploader</h1>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; letter-spacing: 0.5px;">VERSION ${version}</span>
                        <span style="color: #718096; font-size: 11px; font-weight: 500;">•</span>
                        <span style="color: #4a5568; font-size: 11px; font-weight: 600;">Powered by Jawara Digital Solution</span>
                    </div>
                </div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 16px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #4a5568; font-size: 14px; font-weight: 600;">${customer.username || 'User'}</span>
                    ${isProUser ? '<span style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; letter-spacing: 0.5px;">✨ PRO</span>' : '<span style="background: #e2e8f0; color: #4a5568; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; letter-spacing: 0.5px;">NORMAL</span>'}
                </div>
                
                <div class="dropdown-menu">
                    <button class="dropdown-toggle" id="menu-toggle">
                        <span style="font-size: 16px;">☰</span>
                        <span>Menu</span>
                        <span class="arrow">▼</span>
                    </button>
                    <div class="dropdown-content" id="dropdown-menu">
                        <button class="dropdown-item ${currentPage === 'upload' ? 'active' : ''}" data-route="upload">
                            <span class="icon">📤</span>
                            <span>Upload</span>
                        </button>
                        ${isProUser ? `
                        <button class="dropdown-item ${currentPage === 'autobot' ? 'active' : ''}" data-route="autobot">
                            <span class="icon">🤖</span>
                            <span>Alfred</span>
                        </button>
                        ` : ''}
                        <button class="dropdown-item ${currentPage === 'documentation' ? 'active' : ''}" data-route="documentation">
                            <span class="icon">📖</span>
                            <span>Documentation</span>
                        </button>
                        <button class="dropdown-item ${currentPage === 'profile' ? 'active' : ''}" data-route="profile">
                            <span class="icon">👤</span>
                            <span>Profile</span>
                        </button>
                        <button class="dropdown-item logout" id="logout-btn">
                            <span class="icon">🚪</span>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Initialize header navigation
 * @param {Object} router - The router object
 */
function initSharedHeader(router) {
    setRouter(router);
    // Dropdown toggle
    const menuToggle = document.getElementById('menu-toggle');
    const dropdownMenu = document.getElementById('dropdown-menu');

    if (menuToggle && dropdownMenu) {
        // Toggle dropdown on click
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
            menuToggle.classList.toggle('open');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('show');
                menuToggle.classList.remove('open');
            }
        });

        // Close dropdown when clicking a menu item
        const dropdownItems = dropdownMenu.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', () => {
                dropdownMenu.classList.remove('show');
                menuToggle.classList.remove('open');
            });
        });
    }

    // Navigation menu items
    const menuItems = document.querySelectorAll('.dropdown-item[data-route]');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const route = item.getAttribute('data-route');
            if (route) {
                router.navigate(route);
            }
        });
    });

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                // Get API URL from environment
                const API_URL = process.env.API_URL || 'http://localhost:3000/api';
                const token = localStorage.getItem('token');

                // Call logout endpoint
                if (token) {
                    await apiFetch(`${API_URL}/customers/logout`, {
                        method: 'POST',
                    });
                }
            } catch (error) {
                console.error('Logout API error:', error);
                // Continue with logout even if API call fails
            } finally {
                // Clear local storage and redirect
                localStorage.removeItem('token');
                localStorage.removeItem('customer');
                router.navigate('login');
            }
        });
    }
}

module.exports = {
    getSharedHeader,
    initSharedHeader
};

