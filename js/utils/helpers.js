/**
 * Utility functions for formatting and common tasks
 */
export const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || Number.isNaN(amount)) return 'UGX 0';
    return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount).replace('UGX', 'UGX ');
};

export const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
};

export const formatTime = (timeStr) => {
    if (!timeStr) return '---';
    // timeStr is usually "HH:mm"
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
};

export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};
