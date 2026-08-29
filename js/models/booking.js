/**
 * Booking Data Model
 */
export class Booking {
    constructor({
        id,
        customerName,
        customerPhone,
        pickupLocation,
        destination,
        dateTime,
        passengers,
        bags,
        notes = '',
        serviceType,
        totalFare,
        depositAmount,
        amountPaid = 0,
        status = 'awaiting_confirmation',
        paymentStatus = 'unpaid',
        createdAt = new Date().toISOString()
    }) {
        this.id = id;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.pickupLocation = pickupLocation;
        this.destination = destination;
        this.dateTime = dateTime;
        this.passengers = passengers;
        this.bags = bags;
        this.notes = notes;
        this.serviceType = serviceType;
        this.totalFare = totalFare;
        this.depositAmount = depositAmount;
        this.amountPaid = amountPaid;
        this.status = status;
        this.paymentStatus = paymentStatus;
        this.createdAt = createdAt;
    }

    get balanceDue() {
        return this.totalFare - this.amountPaid;
    }

    static fromJSON(json) {
        return new Booking(json);
    }
}
