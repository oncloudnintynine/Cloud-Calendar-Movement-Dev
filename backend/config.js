// ==========================================
// config.js - Application Configuration
// ==========================================

// ENVIRONMENT TOGGLE
// Options: 'Exp' (Experimental) | 'Dev' (Development) | 'Prod' (Production)
const ENV = 'Dev'; 

// ENVIRONMENT API ENDPOINTS (Google Apps Script Web App URLs)
const EXP_URL = 'https://script.google.com/macros/s/AKfycbwgY-ik3-hWmoLIziCkyoP2RZCriI_cZTgLgBWLxx37QZZ_7j8Pu68DwMAKXBUkI46WOQ/exec';
const DEV_URL = 'https://script.google.com/macros/s/AKfycbzEFd3-Bu1-h1oUKNwz8kEE8qyfMP9KzooIoIszVpL4LDXaSyn_xiPCYJrG_nJfUE2hZQ/exec';
const PROD_URL = 'https://script.google.com/macros/s/AKfycbw6GmmwAW7UoSpjNoCnkdeAVDHmA0amBu73hy43NOj77KGggTzXeRvOFhpWA_dDE3k7/exec';

const API_URL = ENV === 'Exp' ? EXP_URL : (ENV === 'Dev' ? DEV_URL : PROD_URL);