/**
 * Utility functions for formatting and common tasks
 */
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount).replace('UGX', 'UGX ');
};

export const formatDate = (dateStr) => {
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
};

export const formatTime = (timeStr) => {
    // timeStr is usually "HH:mm"
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
};

export const generateBookingMessage = (booking) => {
    const fareStr = formatCurrency(booking.totalFare);
    const depositStr = formatCurrency(booking.depositAmount);

    return `*BeePilot Booking Request*
Ref: ${booking.id}
---
*Customer:* ${booking.customerName}
*Phone:* ${booking.customerPhone}
*Service:* ${booking.serviceType}
*Route:* ${booking.pickupLocation} to ${booking.destination}
*Date:* ${booking.date} at ${booking.time}
*Details:* ${booking.passengers} pax, ${booking.bags} bags
---
*Total Fare:* ${fareStr}
*Deposit Required:* ${depositStr}
---
Please confirm availability.`;
};
