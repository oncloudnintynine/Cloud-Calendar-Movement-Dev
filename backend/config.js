// ==========================================
// config.js - Application Configuration
// ==========================================

// ENVIRONMENT TOGGLE
// Options: 'Exp' (Experimental) | 'Dev' (Development) | 'Prod' (Production)
const ENV = 'Dev'; 

// ENVIRONMENT API ENDPOINTS (Google Apps Script Web App URLs)
// Replace these with your respective deployment URLs

const EXP_URL = 'https://script.google.com/macros/s/AKfycbwjX-GM-zj7DvmLu50DkCk9XcSByy_R5QuZMVf0TtBs8MOLk37TYDuD0CZ9cCxbdgNe/exec';

// REPLACE THIS URL AFTER DEPLOYING FROM THE NEW ACCOUNT
const DEV_URL = 'https://script.google.com/macros/s/AKfycbx8Nh11zTYLrE0t8gYCrHCNNvPRfwiWKepurO7UaLYNovzhH6Xql9hbA6aGf7QuB6yZvQ/exec';

const PROD_URL = 'https://script.google.com/macros/s/AKfycbw6GmmwAW7UoSpjNoCnkdeAVDHmA0amBu73hy43NOj77KGggTzXeRvOFhpWA_dDE3k7/exec';

const API_URL = ENV === 'Exp' ? EXP_URL : (ENV === 'Dev' ? DEV_URL : PROD_URL);
