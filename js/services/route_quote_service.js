/**
 * Service for calculating route fares and estimates
 */
export class RouteQuoteService {
    constructor() {
        // Mock rates - these would come from FareSettingsRepository in a real app
        this.baseFare = 5000;
        this.perKmRate = 2500;
        this.airportFixedRate = 230000;
        this.specialHireDayRate = 450000;
    }

    async calculateQuote(serviceType, pickup, destination) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        let fare = 0;
        let distance = "---";
        let duration = "---";

        if (serviceType === 'airportTransfer') {
            fare = this.airportFixedRate;
            distance = "approx. 270 km";
            duration = "4h 30m";
        } else if (serviceType === 'specialHire') {
            fare = this.specialHireDayRate;
            distance = "unlimited (town)";
            duration = "12 hours";
        } else {
            // Mock city/intercity calculation
            fare = 35000 + (Math.random() * 50000);
            distance = "local";
            duration = "20-45 mins";
        }

        // Round to nearest 500 UGX
        fare = Math.round(fare / 500) * 500;

        return {
            fare,
            distance,
            duration,
            deposit: fare * 0.3
        };
    }
}
