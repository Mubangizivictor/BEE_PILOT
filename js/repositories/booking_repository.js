/**
 * Repository for managing bookings in LocalStorage
 */
export class BookingRepository {
    constructor() {
        this.storageKey = 'beepilot_bookings';
    }

    getAll() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    getById(id) {
        const bookings = this.getAll();
        return bookings.find(b => b.id === id);
    }

    save(booking) {
        const bookings = this.getAll();
        const index = bookings.findIndex(b => b.id === booking.id);

        if (index >= 0) {
            bookings[index] = booking;
        } else {
            bookings.push(booking);
        }

        localStorage.setItem(this.storageKey, JSON.stringify(bookings));
    }

    delete(id) {
        const bookings = this.getAll();
        const filtered = bookings.filter(b => b.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    }

    generateId() {
        const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `BP-${date}-${random}`;
    }
}
