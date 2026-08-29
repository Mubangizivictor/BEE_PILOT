import { FareRepository } from '../repositories/fare_repository.js';

/**
 * Service for calculating route fares and estimates using Uber-like logic
 */
export class RouteQuoteService {
    constructor() {
        this.fareRepo = new FareRepository();
    }

    /**
     * Calculates the quote based on service type, distance and duration.
     * Formula: Base Fare + (Distance * Rate) + (Time * Rate) + Booking Fee
     *
     * @param {string} serviceType
     * @param {string} pickup
     * @param {string} destination
     * @param {Object|null} mapResult - { distanceKm: number, durationMins: number }
     */
    async calculateQuote(serviceType, pickup, destination, mapResult = null) {
        const settings = this.fareRepo.getSettings();

        let fare = 0;
        let distanceStr = "---";
        let durationStr = "---";

        if (serviceType === 'airportTransfer') {
            fare = settings.airportFixedRate;
            distanceStr = mapResult ? `${mapResult.distanceKm.toFixed(1)} km` : "approx. 270 km";
            durationStr = mapResult ? `${Math.round(mapResult.durationMins)} mins` : "4h 30m";
        } else if (serviceType === 'specialHire') {
            fare = settings.specialHireDayRate;
            distanceStr = "12 hours limit";
            durationStr = "Full Day";
        } else {
            // Uber-like Dynamic Pricing
            const distance = mapResult ? mapResult.distanceKm : 5; // Default 5km for preview
            const duration = mapResult ? mapResult.durationMins : (distance * 2.5); // Estimate 2.5 mins per km if missing

            // Formula: Base + (KM * PerKm) + (Min * PerMin) + Booking Fee
            fare = settings.baseFare +
                   (distance * settings.perKmRate) +
                   (duration * (settings.perMinuteRate || 300)) +
                   (settings.bookingFee || 2000);

            // Enforce Minimum Fare
            if (fare < settings.minFare) {
                fare = settings.minFare;
            }

            distanceStr = `${distance.toFixed(1)} km`;
            durationStr = `${Math.round(duration)} mins`;
        }

        // Round to nearest 500 UGX
        fare = Math.round(fare / 500) * 500;
        const deposit = Math.round((fare * (settings.depositPercentage / 100)) / 500) * 500;

        return {
            fare,
            distance: distanceStr,
            duration: durationStr,
            deposit: deposit,
            balance: fare - deposit
        };
    }
}
