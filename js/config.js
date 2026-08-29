/**
 * Global Configuration for BeePilot
 */
export const CONFIG = {
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8787'
        : 'https://beepilot-api.victorbee.workers.dev', // Ensure this matches your deployment
    WHATSAPP_NUMBER: '256793128137',
    WHATSAPP_LINK: 'https://wa.me/256793128137',
    CURRENCY: 'UGX',
    DEPOSIT_PERCENTAGE: 30,
    MTN_MOMO: '0793128137',
    AIRTEL_MONEY: '0740116746',
    BANK_ACCOUNT: '3205381235',
    BANK_NAME: 'Centenary Bank',
    ACCOUNT_NAME: 'Victor Mubangizi'
};
