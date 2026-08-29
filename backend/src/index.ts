export interface Env {
  DB: D1Database;
  GOOGLE_MAPS_API_KEY: string;
  ADMIN_TOKEN: string;
  PUBLIC_ORIGIN: string;
}

type FareSettings = {
  minimum_town_fare: number;
  base_fare: number;
  town_rate_per_km: number;
  outstation_rate_per_km: number;
  rate_per_minute: number;
  deposit_percent: number;
  special_hire_day_rate: number;
  return_factor: number;
};

const json = (body: unknown, status = 200, origin = "*") =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "access-control-allow-origin": origin,
      "access-control-allow-headers": "content-type, authorization",
      "access-control-allow-methods": "GET, POST, PUT, OPTIONS",
    },
  });

const requestOrigin = (request: Request, env: Env) => {
  const origin = request.headers.get("Origin");
  return origin === env.PUBLIC_ORIGIN ? origin : env.PUBLIC_ORIGIN;
};

const round500 = (amount: number) => Math.round(amount / 500) * 500;
const id = (prefix: string) => `${prefix}-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

function isAdmin(request: Request, env: Env) {
  return request.headers.get("authorization") === `Bearer ${env.ADMIN_TOKEN}`;
}

async function settings(env: Env): Promise<FareSettings> {
  const record = await env.DB.prepare("SELECT * FROM fare_settings WHERE id = 1").first<FareSettings>();
  if (!record) throw new Error("Fare settings are missing");
  return record;
}

async function route(origin: string, destination: string, env: Env) {
  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": env.GOOGLE_MAPS_API_KEY,
      "x-goog-fieldmask": "routes.distanceMeters,routes.duration",
    },
    body: JSON.stringify({
      origin: { address: origin },
      destination: { address: destination },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_UNAWARE",
      units: "METRIC",
    }),
  });

  if (!response.ok) throw new Error("Route lookup failed");
  const data = await response.json<{ routes?: Array<{ distanceMeters: number; duration: string }> }>();
  const found = data.routes?.[0];
  if (!found) throw new Error("No driving route found");
  return {
    distanceMeters: found.distanceMeters,
    durationSeconds: Number.parseFloat(found.duration),
  };
}

function calculateFare(serviceType: string, r: { distanceMeters: number; durationSeconds: number }, s: FareSettings) {
  if (serviceType === "special_hire") return s.special_hire_day_rate;
  const km = r.distanceMeters / 1000;
  const minutes = r.durationSeconds / 60;
  const intercity = serviceType === "intercity" || serviceType === "airport_transfer";
  const kmRate = intercity ? s.outstation_rate_per_km : s.town_rate_per_km;
  const returnMultiplier = intercity ? s.return_factor : 1;
  const raw = s.base_fare + (km * kmRate * returnMultiplier) + (minutes * s.rate_per_minute);
  return Math.max(s.minimum_town_fare, round500(raw));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = requestOrigin(request, env);
    if (request.method === "OPTIONS") return json({}, 204, origin);

    const url = new URL(request.url);
    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return json({ ok: true, service: "beepilot-api" }, 200, origin);
      }

      if (request.method === "POST" && url.pathname === "/api/quote") {
        const body = await request.json<{ serviceType: string; pickupLocation: string; destination: string }>();
        if (!body.serviceType || !body.pickupLocation || !body.destination) {
          return json({ error: "Service type, pickup and destination are required." }, 400, origin);
        }
        const [r, s] = await Promise.all([route(body.pickupLocation, body.destination, env), settings(env)]);
        const fare = calculateFare(body.serviceType, r, s);
        return json({
          totalFare: fare,
          depositAmount: round500(fare * (s.deposit_percent / 100)),
          distanceMeters: r.distanceMeters,
          durationSeconds: r.durationSeconds,
          quoteNotice: "Estimate is confirmed only after BeePilot accepts the booking.",
        }, 200, origin);
      }

      if (request.method === "POST" && url.pathname === "/api/bookings") {
        const body = await request.json<{
          customerName: string; customerPhone: string; serviceType: string;
          pickupLocation: string; destination: string; travelAt: string;
          passengers?: number; bags?: number; notes?: string;
          totalFare: number; depositRequired: number; distanceMeters?: number; durationSeconds?: number;
        }>();
        const required = [body.customerName, body.customerPhone, body.serviceType, body.pickupLocation, body.destination, body.travelAt];
        if (required.some(value => !value) || !Number.isFinite(body.totalFare) || !Number.isFinite(body.depositRequired)) {
          return json({ error: "Complete booking information is required." }, 400, origin);
        }
        const bookingId = id("BP");
        const publicToken = crypto.randomUUID().replace(/-/g, "");
        const now = new Date().toISOString();
        await env.DB.prepare(`INSERT INTO bookings (
          id, public_token, customer_name, customer_phone, service_type, pickup_location,
          destination, travel_at, passengers, bags, notes, distance_meters, duration_seconds,
          total_fare, deposit_required, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
          bookingId, publicToken, body.customerName.trim(), body.customerPhone.trim(), body.serviceType,
          body.pickupLocation.trim(), body.destination.trim(), body.travelAt, body.passengers ?? 1,
          body.bags ?? 0, body.notes?.trim() ?? null, body.distanceMeters ?? null, body.durationSeconds ?? null,
          Math.round(body.totalFare), Math.round(body.depositRequired), now, now
        ).run();
        return json({ bookingId, publicToken, tripStatus: "awaiting_confirmation", paymentStatus: "unpaid" }, 201, origin);
      }

      const publicMatch = url.pathname.match(/^\/api\/bookings\/public\/([a-f0-9]+)$/);
      if (request.method === "GET" && publicMatch) {
        const booking = await env.DB.prepare(`SELECT id, customer_name, service_type, pickup_location, destination,
          travel_at, total_fare, deposit_required, amount_paid, payment_status, trip_status, created_at
          FROM bookings WHERE public_token = ?`).bind(publicMatch[1]).first();
        return booking ? json(booking, 200, origin) : json({ error: "Booking not found" }, 404, origin);
      }

      if (url.pathname.startsWith("/api/admin/")) {
        if (!isAdmin(request, env)) return json({ error: "Unauthorized" }, 401, origin);

        if (request.method === "GET" && url.pathname === "/api/admin/bookings") {
          const results = await env.DB.prepare("SELECT * FROM bookings ORDER BY created_at DESC").all();
          return json(results.results, 200, origin);
        }

        const paymentMatch = url.pathname.match(/^\/api\/admin\/bookings\/([^/]+)\/payments$/);
        if (request.method === "POST" && paymentMatch) {
          const body = await request.json<{ amount: number; method: "mtn_momo" | "airtel_money" | "bank"; transactionReference: string; receivedAt?: string; note?: string }>();
          if (!Number.isFinite(body.amount) || body.amount <= 0 || !body.method || !body.transactionReference?.trim()) {
            return json({ error: "Valid payment amount, method and transaction reference are required." }, 400, origin);
          }
          const booking = await env.DB.prepare("SELECT * FROM bookings WHERE id = ?").bind(paymentMatch[1]).first<{ total_fare: number; amount_paid: number }>();
          if (!booking) return json({ error: "Booking not found" }, 404, origin);
          if (booking.amount_paid + body.amount > booking.total_fare) return json({ error: "Payment exceeds the booking balance." }, 400, origin);

          const paymentId = id("PAY");
          const receiptId = id("RCP");
          const receiptNumber = `BR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
          const amountPaid = booking.amount_paid + Math.round(body.amount);
          const status = amountPaid === booking.total_fare ? "paid_in_full" : "deposit_paid";
          const now = new Date().toISOString();
          await env.DB.batch([
            env.DB.prepare("INSERT INTO payments (id, booking_id, amount, method, transaction_reference, received_at, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
              .bind(paymentId, paymentMatch[1], Math.round(body.amount), body.method, body.transactionReference.trim(), body.receivedAt ?? now, body.note?.trim() ?? null, now),
            env.DB.prepare("UPDATE bookings SET amount_paid = ?, payment_status = ?, updated_at = ? WHERE id = ?")
              .bind(amountPaid, status, now, paymentMatch[1]),
            env.DB.prepare("INSERT INTO receipts (id, booking_id, receipt_number, payment_id, issued_at) VALUES (?, ?, ?, ?, ?)")
              .bind(receiptId, paymentMatch[1], receiptNumber, paymentId, now),
          ]);
          return json({ paymentId, receiptId, receiptNumber, amountPaid, balanceDue: booking.total_fare - amountPaid, paymentStatus: status }, 201, origin);
        }
      }

      return json({ error: "Not found" }, 404, origin);
    } catch (error) {
      console.error(error);
      return json({ error: "The request could not be completed." }, 500, origin);
    }
  },
};
