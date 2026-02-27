/**
 * Wrapper around fetch that automatically handles 401 responses
 * by clearing the session and navigating to the login page.
 */

let _router = null;

function setRouter(router) {
    _router = router;
}

async function handleUnauthorized() {
    localStorage.removeItem('token');
    localStorage.removeItem('customer');
    if (_router) {
        _router.navigate('login');
    }
}

async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        await handleUnauthorized();
        throw new Error('Session expired. Please login again.');
    }

    return response;
}

async function validateSession() {
    const token = localStorage.getItem('token');
    if (!token) {
        await handleUnauthorized();
        return false;
    }

    try {
        const API_URL = process.env.API_URL;
        const response = await apiFetch(`${API_URL}/customers/validate-session`, {
            method: 'POST',
        });
        const data = await response.json();
        return !!data.valid;
    } catch (error) {
        // 401 already handled by apiFetch
        return false;
    }
}

module.exports = { apiFetch, setRouter, validateSession };

