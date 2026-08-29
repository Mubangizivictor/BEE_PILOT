export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Public: Save Booking
      if (url.pathname === "/bookings" && request.method === "POST") {
        const booking = await request.json();
        await env.DB.prepare(
          "INSERT INTO bookings (id, customerName, customerPhone, pickupLocation, destination, date, time, passengers, bags, serviceType, totalFare, depositAmount, status, paymentMethod, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          booking.id, booking.customerName, booking.customerPhone, booking.pickupLocation, booking.destination,
          booking.date, booking.time, booking.passengers, booking.bags, booking.serviceType, booking.totalFare,
          booking.depositAmount, 'awaiting_confirmation', booking.paymentMethod, booking.notes, new Date().toISOString()
        ).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Public: Get Booking by ID
      if (url.pathname.startsWith("/bookings/") && request.method === "GET") {
        const id = url.pathname.split("/").pop();
        const booking = await env.DB.prepare("SELECT * FROM bookings WHERE id = ?").bind(id).first();
        if (!booking) return new Response("Not Found", { status: 404, headers: corsHeaders });
        return new Response(JSON.stringify(booking), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Admin Auth
      if (url.pathname === "/admin/login" && request.method === "POST") {
        const { pin } = await request.json();
        if (pin === env.ADMIN_PIN) {
          // Simple token for demo, in production use JWT
          const token = btoa(JSON.stringify({ role: 'admin', exp: Date.now() + 86400000 }));
          return new Response(JSON.stringify({ token }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        return new Response("Unauthorized", { status: 401, headers: corsHeaders });
      }

      // Admin: Get All Bookings
      if (url.pathname === "/admin/bookings" && request.method === "GET") {
        const auth = request.headers.get("Authorization");
        if (!auth) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

        const bookings = await env.DB.prepare("SELECT * FROM bookings ORDER BY createdAt DESC").all();
        return new Response(JSON.stringify(bookings.results), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Admin: Confirm Payment
      if (url.pathname === "/admin/payments/confirm" && request.method === "POST") {
        const { bookingId } = await request.json();
        await env.DB.prepare("UPDATE bookings SET status = 'paid', paymentConfirmed = 1 WHERE id = ?").bind(bookingId).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });
    } catch (e) {
      return new Response(e.message, { status: 500, headers: corsHeaders });
    }
  },
};
