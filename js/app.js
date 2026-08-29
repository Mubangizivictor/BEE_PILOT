import { BookingRepository } from './repositories/booking_repository.js';
import { RouteQuoteService } from './services/route_quote_service.js';
import { formatCurrency, formatDate, formatTime, generateBookingMessage } from './utils/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
    const bookingRepo = new BookingRepository();
    const quoteService = new RouteQuoteService();

    // DOM Elements
    const steps = {
        1: document.getElementById('step-1'),
        2: document.getElementById('step-2'),
        3: document.getElementById('step-3')
    };

    const indicators = {
        1: document.getElementById('step-1-indicator'),
        2: document.getElementById('step-2-indicator'),
        3: document.getElementById('step-3-indicator')
    };

    const bookingForm = document.getElementById('booking-form');
    let currentBookingData = {};
    let autocompletePickup, autocompleteDest;

    // Initialize Google Maps Autocomplete
    const initAutocomplete = () => {
        if (typeof google === 'undefined') return;

        const options = {
            componentRestrictions: { country: "ug" },
            fields: ["address_components", "geometry", "name"],
        };

        const pickupInput = document.getElementById('pickupLocation');
        const destInput = document.getElementById('destination');

        if (pickupInput) {
            autocompletePickup = new google.maps.places.Autocomplete(pickupInput, options);
            autocompletePickup.addListener("place_changed", updateFareDisplay);
        }

        if (destInput) {
            autocompleteDest = new google.maps.places.Autocomplete(destInput, options);
            autocompleteDest.addListener("place_changed", updateFareDisplay);
        }
    };

    // Calculate distance and duration using Google Distance Matrix
    const getRouteData = (origin, destination) => {
        return new Promise((resolve) => {
            if (typeof google === 'undefined' || !origin || !destination) {
                resolve(null);
                return;
            }

            const service = new google.maps.DistanceMatrixService();
            service.getDistanceMatrix(
                {
                    origins: [origin],
                    destinations: [destination],
                    travelMode: google.maps.TravelMode.DRIVING,
                    unitSystem: google.maps.UnitSystem.METRIC,
                },
                (response, status) => {
                    if (status === "OK" && response.rows[0].elements[0].status === "OK") {
                        const distanceInMeters = response.rows[0].elements[0].distance.value;
                        const durationInSeconds = response.rows[0].elements[0].duration.value;
                        resolve({
                            distanceKm: distanceInMeters / 1000,
                            durationMins: durationInSeconds / 60
                        });
                    } else {
                        resolve(null);
                    }
                }
            );
        });
    };

    // Navigation logic
    const showStep = (stepNumber) => {
        Object.values(steps).forEach(s => s.classList.remove('active'));
        steps[stepNumber].classList.add('active');

        // Update indicators
        Object.entries(indicators).forEach(([num, el]) => {
            if (num < stepNumber) {
                el.classList.add('bg-sage', 'text-white');
                el.classList.remove('bg-honey', 'bg-white', 'text-charcoal', 'text-gray-400');
            } else if (num == stepNumber) {
                el.classList.add('bg-honey', 'text-charcoal');
                el.classList.remove('bg-sage', 'bg-white', 'text-white', 'text-gray-400');
            } else {
                el.classList.add('bg-white', 'text-gray-400');
                el.classList.remove('bg-sage', 'bg-honey', 'text-white', 'text-charcoal');
            }
        });
        window.scrollTo(0, 0);
    };

    // Step 1 -> 2
    document.getElementById('next-to-step-2')?.addEventListener('click', () => {
        const service = document.querySelector('input[name="serviceType"]:checked').value;
        currentBookingData.serviceType = service;
        showStep(2);
        updateFareDisplay();
    });

    // Step 2 -> 1
    document.getElementById('back-to-step-1')?.addEventListener('click', () => showStep(1));

    // Fare calculation trigger
    const updateFareDisplay = async () => {
        const pickup = document.getElementById('pickupLocation')?.value;
        const dest = document.getElementById('destination')?.value;

        if (!pickup || !dest) return;

        // Show loading state
        const fareDisplay = document.getElementById('display-fare');
        if (fareDisplay) fareDisplay.textContent = "Calculating...";

        const routeData = await getRouteData(pickup, dest);
        const quote = await quoteService.calculateQuote(currentBookingData.serviceType, pickup, dest, routeData);

        if (fareDisplay) fareDisplay.textContent = formatCurrency(quote.fare);
        currentBookingData.quote = quote;
    };

    ['pickupLocation', 'destination'].forEach(id => {
        document.getElementById(id)?.addEventListener('blur', updateFareDisplay);
    });

    // Step 2 Submission (Details -> Review)
    bookingForm?.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!currentBookingData.quote) {
            alert("Please wait for the fare to be calculated.");
            return;
        }

        currentBookingData = {
            ...currentBookingData,
            id: bookingRepo.generateId(),
            customerName: document.getElementById('customerName').value,
            customerPhone: document.getElementById('customerPhone').value,
            pickupLocation: document.getElementById('pickupLocation').value,
            destination: document.getElementById('destination').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            passengers: document.getElementById('passengers').value,
            bags: document.getElementById('bags').value,
            notes: document.getElementById('notes').value,
            totalFare: currentBookingData.quote.fare,
            depositAmount: currentBookingData.quote.deposit
        };

        // Populate Review Step
        document.getElementById('display-ref').textContent = currentBookingData.id;
        document.getElementById('confirm-name').textContent = currentBookingData.customerName;
        document.getElementById('confirm-phone').textContent = currentBookingData.customerPhone;
        document.getElementById('confirm-pickup').textContent = currentBookingData.pickupLocation;
        document.getElementById('confirm-dest').textContent = currentBookingData.destination;
        document.getElementById('confirm-datetime').textContent = `${formatDate(currentBookingData.date)} at ${formatTime(currentBookingData.time)}`;
        document.getElementById('confirm-pass').textContent = currentBookingData.passengers;
        document.getElementById('confirm-bags').textContent = currentBookingData.bags;
        document.getElementById('confirm-fare').textContent = formatCurrency(currentBookingData.totalFare);
        document.getElementById('confirm-deposit').textContent = formatCurrency(currentBookingData.depositAmount);
        document.getElementById('confirm-balance').textContent = formatCurrency(currentBookingData.totalFare - currentBookingData.depositAmount);

        showStep(3);
    });

    // Step 3 -> 2
    document.getElementById('back-to-step-2')?.addEventListener('click', () => showStep(2));

    // Final Action: Send to WhatsApp
    document.getElementById('send-whatsapp')?.addEventListener('click', () => {
        // Save to local storage
        bookingRepo.save({
            ...currentBookingData,
            status: 'awaiting_confirmation',
            createdAt: new Date().toISOString()
        });

        const message = generateBookingMessage(currentBookingData);
        const encodedMessage = encodeURIComponent(message);
        const whatsappNumber = "256700000000";
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
        window.location.href = `booking-confirmation.html?ref=${currentBookingData.id}`;
    });

    // Initialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    initAutocomplete();
});
