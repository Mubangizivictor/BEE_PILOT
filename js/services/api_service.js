import { CONFIG } from '../config.js';

export class ApiService {
    static async request(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'API Request Failed');
        }
        return response.json();
    }

    static async getBooking(id) {
        return this.request(`/bookings/${id}`);
    }

    static async createBooking(data) {
        return this.request('/bookings', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async adminLogin(pin) {
        return this.request('/admin/login', {
            method: 'POST',
            body: JSON.stringify({ pin })
        });
    }

    static async getAdminBookings() {
        const token = sessionStorage.getItem('bp_admin_token');
        return this.request('/admin/bookings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    }

    static async confirmPayment(bookingId) {
        const token = sessionStorage.getItem('bp_admin_token');
        return this.request('/admin/payments/confirm', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ bookingId })
        });
    }
}
