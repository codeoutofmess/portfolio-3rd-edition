import { site } from "@/lib/site";

// Sends the contact form to my inbox through Resend (https://resend.com).
// Set RESEND_API_KEY on the host. Optional: CONTACT_TO (default: site email) and
// CONTACT_FROM (default: Resend's shared test sender, which can only deliver to the Resend account's own email).
const API = process.env.RESEND_API_URL ?? "https://api.resend.com/emails";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// shortcut: in-memory limit, per server instance only; move to a shared store (e.g. Upstash) if spam appears.
const hits = new Map<string, number[]>();
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const oneLine = (v: string) => v.replace(/[\r\n]+/g, " ");

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return Response.json({ error: "Bad request." }, { status: 400 });

  // Hidden field only bots fill in: pretend it worked.
  if (clean(body.website, 100)) return Response.json({ ok: true });

  const name = oneLine(clean(body.name, 100));
  const email = clean(body.email, 200);
  const subject = oneLine(clean(body.subject, 150));
  const message = clean(body.message, 5000);
  if (!name || !EMAIL.test(email) || !message) {
    return Response.json({ error: "Please add your name, a valid email and a message." }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    return Response.json({ error: "Too many messages from this connection. Please try again later." }, { status: 429 });
  }
  hits.set(ip, [...recent, now]);

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return Response.json({ error: `Sending isn't set up yet. Email me at ${site.email} instead.` }, { status: 503 });
  }

  const res = await fetch(API, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM ?? `Portfolio contact <onboarding@resend.dev>`,
      to: [process.env.CONTACT_TO ?? site.email],
      reply_to: email,
      subject: `[Portfolio] ${subject || `Message from ${name}`}`,
      text: `From: ${name} <${email}>\nSubject: ${subject || "(none)"}\n\n${message}\n`,
    }),
  }).catch(() => null);

  if (!res?.ok) {
    return Response.json({ error: `Couldn't send that. Email me at ${site.email} instead.` }, { status: 502 });
  }
  return Response.json({ ok: true });
}
