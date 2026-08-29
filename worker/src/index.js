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

    // Helper: Check Admin Auth
    const isAdmin = (req) => {
      const auth = req.headers.get("Authorization");
      if (!auth) return false;
      try {
        const token = JSON.parse(atob(auth.split(" ")[1]));
        return token.role === 'admin' && token.exp > Date.now();
      } catch (e) { return false; }
    };

    try {
      // --- PUBLIC ROUTES ---

      // GET Fare Settings
      if (url.pathname === "/fare-settings" && request.method === "GET") {
        const row = await env.DB.prepare("SELECT configValue FROM fare_settings WHERE configKey = 'default_fares' AND isActive = 1").first();
        return new Response(row.configValue, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // POST Create Booking
      if (url.pathname === "/bookings" && request.method === "POST") {
        const b = await request.json();
        const token = crypto.randomUUID();

        await env.DB.prepare(`
          INSERT INTO bookings (
            id, token, customerName, customerPhone, pickupLocation, destination,
            date, time, passengers, bags, serviceType, totalFare, depositAmount,
            status, notes, distanceKm, durationMins, fareSnapshot
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_payment', ?, ?, ?, ?)
        `).bind(
          b.id, token, b.customerName, b.customerPhone, b.pickupLocation, b.destination,
          b.date, b.time, b.passengers, b.bags || 0, b.serviceType, b.totalFare, b.depositAmount,
          b.notes || '', b.distanceKm, b.durationMins, JSON.stringify(b.fareSnapshot)
        ).run();

        return new Response(JSON.stringify({ success: true, token }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // GET Booking by ID (Public Token)
      if (url.pathname.startsWith("/bookings/") && request.method === "GET") {
        const id = url.pathname.split("/").pop();
        const booking = await env.DB.prepare("SELECT * FROM bookings WHERE id = ?").bind(id).first();
        if (!booking) return new Response("Not Found", { status: 404, headers: corsHeaders });

        // Fetch payment status
        const payment = await env.DB.prepare("SELECT * FROM payments WHERE bookingId = ?").bind(id).first();

        return new Response(JSON.stringify({ ...booking, payment }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // --- ADMIN ROUTES ---

      // POST Admin Login
      if (url.pathname === "/admin/login" && request.method === "POST") {
        const { pin } = await request.json();
        if (pin === env.ADMIN_PIN) {
          const token = btoa(JSON.stringify({ role: 'admin', exp: Date.now() + 86400000 }));
          return new Response(JSON.stringify({ token }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        return new Response("Unauthorized", { status: 401, headers: corsHeaders });
      }

      // GET Admin Stats
      if (url.pathname === "/admin/stats" && isAdmin(request)) {
        const bookings = await env.DB.prepare("SELECT COUNT(*) as total, SUM(totalFare) as revenue FROM bookings").first();
        const pending = await env.DB.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'awaiting_payment'").first();
        return new Response(JSON.stringify({ ...bookings, pending: pending.count }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // GET All Bookings
      if (url.pathname === "/admin/bookings" && isAdmin(request)) {
        const { results } = await env.DB.prepare("SELECT * FROM bookings ORDER BY createdAt DESC").all();
        return new Response(JSON.stringify(results), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // POST Confirm Payment
      if (url.pathname === "/admin/payments/confirm" && isAdmin(request)) {
        const p = await request.json();
        const paymentId = crypto.randomUUID();

        // Atomic update: Insert payment record and update booking status
        const batch = [
          env.DB.prepare("INSERT INTO payments (id, bookingId, method, amount, transactionRef, status, verifiedBy, verifiedAt, ownerNote) VALUES (?, ?, ?, ?, ?, 'confirmed', 'admin', CURRENT_TIMESTAMP, ?)")
            .bind(paymentId, p.bookingId, p.method, p.amount, p.transactionRef, p.note || ''),
          env.DB.prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ?").bind(p.bookingId)
        ];

        await env.DB.batch(batch);

        // Log activity
        await env.DB.prepare("INSERT INTO audit_logs (action, entityType, entityId, userId, details) VALUES ('CONFIRM_PAYMENT', 'BOOKING', ?, 'admin', ?)")
          .bind(p.bookingId, `Confirmed UGX ${p.amount} via ${p.method}`).run();

        return new Response(JSON.stringify({ success: true, paymentId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  },
};
