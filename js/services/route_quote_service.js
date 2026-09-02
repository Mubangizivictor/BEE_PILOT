import { ApiService } from './api_service.js';

/**
 * Service for obtaining quotes from the BeePilot backend
 */
export class RouteQuoteService {
    /**
     * Fetches a fixed quote from the backend API
     * @param {string} serviceType
     * @param {string} pickupLocation
     * @param {string} destination
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async getQuote(serviceType, pickupLocation, destination, options = {}) {
        if (!pickupLocation || !destination) {
            throw new Error("Pickup and destination are required for a quote.");
        }

        if (pickupLocation.trim().toLowerCase() === destination.trim().toLowerCase()) {
            throw new Error("Pickup and destination cannot be the same.");
        }

        try {
            const quote = await ApiService.getQuote({
                serviceType,
                pickupLocation,
                destination,
                isReturnTrip: options.isReturnTrip || false
            });

            return {
                totalFare: quote.totalFare,
                depositAmount: quote.depositAmount,
                balance: quote.balance,
                distanceMeters: quote.distanceMeters,
                durationSeconds: quote.durationSeconds,
                expiresAt: quote.expiresAt,
                notice: quote.quoteNotice
            };
        } catch (error) {
            console.error("Failed to get quote:", error);
            throw error;
        }
    }
}
