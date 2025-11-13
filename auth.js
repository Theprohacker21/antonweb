// Authentication helper
function setAuthToken(token) {
    localStorage.setItem('token', token);
}

function getAuthToken() {
    return localStorage.getItem('token');
}

function isLoggedIn() {
    return !!getAuthToken();
}

function logout() {
    localStorage.clear();
    window.location.href = 'signup.html';
}
