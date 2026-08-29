import { FareRepository } from '../repositories/fare_repository.js';

/**
 * Service for calculating route fares using BeePilot's D1-backed fare engine
 */
export class RouteQuoteService {
    constructor() {
        this.fareRepo = new FareRepository();
    }

    async calculateQuote(serviceType, distanceKm, durationMins, options = {}) {
        const settings = await this.fareRepo.getSettings();

        let fare = 0;
        let breakdown = {};

        // 1. Calculate base pricing
        const isIntercity = distanceKm > settings.intercityThresholdKm;

        if (serviceType === 'specialHire') {
            fare = settings.specialHireDayRate;
            breakdown = { type: 'Special Hire Day Rate', amount: fare };
        } else {
            const base = isIntercity ? settings.intercityBase : settings.baseFare;
            const ratePerKm = isIntercity ? settings.intercityPerKm : settings.perKm;
            const ratePerMin = settings.perMin;

            const distanceCharge = distanceKm * ratePerKm;
            const timeCharge = durationMins * ratePerMin;

            fare = base + distanceCharge + timeCharge;

            // Apply Return Trip Factor if requested
            if (options.isReturnTrip) {
                fare *= settings.returnTripFactor;
            }

            // Apply Night Surcharge (9 PM - 5 AM)
            const hour = new Date().getHours();
            if (hour >= 21 || hour < 5) {
                const surcharge = fare * settings.nightSurchargeRate;
                fare += surcharge;
                breakdown.nightSurcharge = Math.round(surcharge);
            }

            // Enforce Minimum Fare
            if (fare < settings.minFare) {
                fare = settings.minFare;
            }
        }

        // Round to nearest 100 UGX for clean pricing
        fare = Math.round(fare / 100) * 100;
        const deposit = Math.round((fare * settings.depositRate) / 100) * 100;

        return {
            totalFare: fare,
            depositAmount: deposit,
            balance: fare - deposit,
            distanceKm: distanceKm.toFixed(1),
            durationMins: Math.round(durationMins),
            fareSnapshot: settings // Save settings version for booking record
        };
    }
}
