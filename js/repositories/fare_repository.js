/**
 * Repository for managing fare settings in LocalStorage
 */
export class FareRepository {
    constructor() {
        this.storageKey = 'beepilot_fare_settings';
        this.defaultSettings = {
            baseFare: 3000,
            minFare: 10000,
            perKmRate: 2000,
            perMinuteRate: 300,
            bookingFee: 2000,
            airportFixedRate: 230000,
            specialHireDayRate: 450000,
            depositPercentage: 30
        };
    }

    getSettings() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : this.defaultSettings;
    }

    saveSettings(settings) {
        localStorage.setItem(this.storageKey, JSON.stringify(settings));
    }
}
