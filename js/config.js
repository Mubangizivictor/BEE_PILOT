/**
 * Global Configuration for BeePilot
 */
export const CONFIG = {
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8787'
        : 'https://beepilot-api.victorbee.workers.dev', // Replace with real Worker URL
    WHATSAPP_NUMBER: '256700000000',
    CURRENCY: 'UGX',
    DEPOSIT_PERCENTAGE: 30
};
