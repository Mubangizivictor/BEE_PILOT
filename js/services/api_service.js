import { CONFIG } from '../config.js';

export class ApiService {
    static async request(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        try {
            const response = await fetch(url, { ...options, headers });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API Request Failed');
            }
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static async getQuote(quoteRequest) {
        return this.request('/api/quote', {
            method: 'POST',
            body: JSON.stringify(quoteRequest)
        });
    }

    static async createBooking(bookingData) {
        return this.request('/api/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    }

    static async getPublicBooking(token) {
        return this.request(`/api/bookings/public/${token}`);
    }

    // Admin endpoints
    static async getAdminBookings() {
        const token = sessionStorage.getItem('bp_admin_token');
        return this.request('/api/admin/bookings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    }

    static async recordPayment(bookingId, paymentData) {
        const token = sessionStorage.getItem('bp_admin_token');
        return this.request(`/api/admin/bookings/${bookingId}/payments`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(paymentData)
        });
    }
}
