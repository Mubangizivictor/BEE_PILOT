import { ApiService } from '../services/api_service.js';

/**
 * Repository for managing fare settings with D1 backend and IndexedDB fallback
 */
export class FareRepository {
    constructor() {
        this.storageKey = 'beepilot_fare_settings';
        this.defaultSettings = {
            baseFare: 1250,
            perKm: 850,
            perMin: 130,
            minFare: 6000,
            intercityBase: 10000,
            intercityPerKm: 1300,
            intercityThresholdKm: 25,
            waitingTimePer15Min: 5000,
            nightSurchargeRate: 0.15,
            depositRate: 0.30,
            returnTripFactor: 1.5,
            specialHireDayRate: 450000
        };
    }

    async getSettings() {
        try {
            // Attempt to get from API (D1)
            const settings = await ApiService.request('/fare-settings');
            localStorage.setItem(this.storageKey, JSON.stringify(settings));
            return settings;
        } catch (error) {
            console.warn('Failed to fetch fare settings from API, using cache:', error);
            const cached = localStorage.getItem(this.storageKey);
            return cached ? JSON.parse(cached) : this.defaultSettings;
        }
    }

    async saveSettings(settings) {
        // Requires admin auth in service
        return ApiService.request('/admin/fare-settings', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('bp_admin_token')}` },
            body: JSON.stringify(settings)
        });
    }
}
