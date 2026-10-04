import { getDatabase } from "@netlify/database";
import { getUser } from "@netlify/identity";

const headers = { "Cache-Control": "no-store" };
const reply = (data, status = 200) => Response.json(data, { status, headers });
const emailOf = (value) => String(value || "").trim().toLowerCase();
const adminEmails = () => new Set(String(process.env.ADMIN_EMAILS || "").split(",").map(emailOf).filter(Boolean));
const isAdmin = (user) => adminEmails().has(emailOf(user.email));
const integerId = (value) => /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const calendarDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const selectJourney = `id, owner_user_id AS "ownerUserId", owner_email AS "recorderEmail", recorder_name AS "recorderName", soul_name AS "soulName", location, encounter_date AS "encounterDate", salvation, salvation_status AS "salvationStatus", healing, healing_details AS "healingDetails", holy_spirit_baptism AS "holySpiritBaptism", created_at AS "createdAt"`;
const selectPrayer = `id, journey_id AS "journeyId", request_text AS "requestText", status, created_at AS "createdAt"`;

function routeOf(request) {
  const path = new URL(request.url).pathname;
  const suffix = path.replace(/^\/(?:\.netlify\/functions\/journey-v2|api)\/?/, "");
  return suffix.split("/").filter(Boolean);
}

async function bodyOf(request) {
  try { return await request.json(); } catch { return null; }
}

async function mayAccess(db, journeyId, user, admin) {
  const rows = await db.sql`
    SELECT id FROM journeys WHERE id = ${journeyId}
      AND (${admin} OR owner_user_id = ${user.id}
        OR (owner_user_id IS NULL AND lower(owner_email) = ${emailOf(user.email)}))
    LIMIT 1`;
  return rows.length > 0;
}

async function snapshot(db, user, admin) {
  const ownerEmail = emailOf(user.email);
  const totals = await publicTotals(db);
  // A migrated record can be claimed on the member's first Google sign-in.
  await db.sql`UPDATE journeys SET owner_user_id = ${user.id}
    WHERE owner_user_id IS NULL AND lower(owner_email) = ${ownerEmail}`;
  const mine = await db.sql.unsafe(`SELECT ${selectJourney} FROM journeys WHERE owner_user_id = $1 ORDER BY id DESC`, [user.id]);
  const team = admin ? await db.sql.unsafe(`SELECT ${selectJourney} FROM journeys ORDER BY id DESC`) : undefined;
  const prayers = admin
    ? await db.sql.unsafe(`SELECT ${selectPrayer} FROM prayer_requests ORDER BY id DESC`)
    : await db.sql.unsafe(`SELECT p.id, p.journey_id AS "journeyId", p.request_text AS "requestText", p.status, p.created_at AS "createdAt" FROM prayer_requests p JOIN journeys j ON j.id = p.journey_id WHERE j.owner_user_id = $1 ORDER BY p.id DESC`, [user.id]);
  return { totals, mine, team, prayers, viewer: { displayName: user.name || user.email, email: user.email, isLeader: admin } };
}

async function publicTotals(db) {
  const rows = await db.sql`
    SELECT count(*)::int AS reached,
      count(*) FILTER (WHERE salvation)::int AS salvations,
      count(*) FILTER (WHERE healing)::int AS healings,
      count(*) FILTER (WHERE holy_spirit_baptism)::int AS baptisms
    FROM journeys`;
  return rows[0] || { reached: 0, salvations: 0, healings: 0, baptisms: 0 };
}

export default async function handler(request) {
  const parts = routeOf(request);
  const method = request.method.toUpperCase();
  if (method === "GET" && parts.length === 1 && parts[0] === "version") {
    return reply({ version: "nctc-worldwide-v3" });
  }
  if (method === "GET" && parts.length === 1 && parts[0] === "totals") {
    try { return reply({ totals: await publicTotals(getDatabase()) }); }
    catch (error) {
      console.error("Public totals unavailable", error);
      return reply({ error: "Totals are temporarily unavailable." }, 503);
    }
  }
  let user;
  try { user = await getUser(); }
  catch (error) { console.error("Identity unavailable", error); return reply({ error: "Sign-in is temporarily unavailable." }, 503); }
  if (!user) return reply({ error: "Please sign in with Google to continue." }, 401);
  // Hiding password login in the UI is not enough: all record APIs enforce Google.
  if (user.provider !== "google") return reply({ error: "Please use Continue with Google." }, 403);
  if (!user.email) return reply({ error: "A verified email address is required." }, 403);

  const admin = isAdmin(user);
  try {
    const db = getDatabase();
    if (method === "GET" && parts.length === 1 && parts[0] === "journeys") {
      return reply(await snapshot(db, user, admin));
    }
    if (method === "POST" && parts.length === 1 && parts[0] === "journeys") {
      const body = await bodyOf(request);
      if (!body || typeof body !== "object") return reply({ error: "Please check the entry." }, 400);
      const soulName = typeof body.soulName === "string" ? body.soulName.trim() : "";
      const location = typeof body.location === "string" ? body.location.trim() : "";
      const encounterDate = body.encounterDate;
      const details = typeof body.healingDetails === "string" ? body.healingDetails.trim() : "";
      if (!soulName || !location || !calendarDate(encounterDate) || soulName.length > 100 || location.length > 160 || details.length > 1000 ||
          !["declined", "praying", "interested", "saved"].includes(body.salvationStatus) ||
          ["healing", "holySpiritBaptism"].some(key => typeof body[key] !== "boolean")) {
        return reply({ error: "Please complete the name, location, and outcome choices." }, 400);
      }
      const rows = await db.sql`
        INSERT INTO journeys (owner_user_id, owner_email, recorder_name, soul_name, location, encounter_date,
          salvation, salvation_status, healing, healing_details, holy_spirit_baptism)
        VALUES (${user.id}, ${emailOf(user.email)}, ${user.name || user.email}, ${soulName}, ${location}, CAST(${encounterDate} AS DATE),
          ${body.salvationStatus === "saved"}, ${body.salvationStatus}, ${body.healing},
          ${body.healing ? (details || null) : null}, ${body.holySpiritBaptism})
        RETURNING id`;
      return reply({ journey: { id: rows[0].id } }, 201);
    }
    if (method === "PATCH" && parts.length === 2 && parts[0] === "journeys") {
      const id = integerId(parts[1]);
      const body = await bodyOf(request);
      if (!id) return reply({ error: "Invalid record." }, 400);
      if (!await mayAccess(db, id, user, admin)) return reply({ error: "Record not found." }, 404);
      if (body?.edit === true) {
        const soulName = typeof body.soulName === "string" ? body.soulName.trim() : "";
        const location = typeof body.location === "string" ? body.location.trim() : "";
        const encounterDate = body.encounterDate || null;
        const details = typeof body.healingDetails === "string" ? body.healingDetails.trim() : "";
        if (!soulName || !location || (encounterDate !== null && !calendarDate(encounterDate)) || soulName.length > 100 || location.length > 160 || details.length > 1000 ||
          !["declined", "praying", "interested", "saved"].includes(body.salvationStatus) ||
          typeof body.healing !== "boolean" || typeof body.holySpiritBaptism !== "boolean") {
          return reply({ error: "Please check the record details and try again." }, 400);
        }
        await db.sql`UPDATE journeys SET soul_name = ${soulName}, location = ${location}, encounter_date = CAST(${encounterDate} AS DATE),
          salvation_status = ${body.salvationStatus}, salvation = ${body.salvationStatus === "saved"},
          healing = ${body.healing}, healing_details = ${body.healing ? (details || null) : null},
          holy_spirit_baptism = ${body.holySpiritBaptism} WHERE id = ${id}`;
      } else {
        if (!["declined", "praying", "interested", "saved"].includes(body?.salvationStatus)) return reply({ error: "Invalid salvation status." }, 400);
        await db.sql`UPDATE journeys SET salvation_status = ${body.salvationStatus}, salvation = ${body.salvationStatus === "saved"} WHERE id = ${id}`;
      }
      return reply({ saved: true });
    }
    if (method === "DELETE" && parts.length === 2 && parts[0] === "journeys") {
      const id = integerId(parts[1]);
      if (!id || !await mayAccess(db, id, user, admin)) return reply({ error: "Record not found." }, 404);
      await db.sql`DELETE FROM journeys WHERE id = ${id}`;
      return reply({ deleted: true });
    }
    if (method === "POST" && parts.length === 3 && parts[0] === "journeys" && parts[2] === "prayers") {
      const id = integerId(parts[1]);
      const body = await bodyOf(request);
      const requestText = typeof body?.requestText === "string" ? body.requestText.trim() : "";
      if (!id || !requestText || requestText.length > 1000) return reply({ error: "Please enter a prayer request under 1,000 characters." }, 400);
      if (!await mayAccess(db, id, user, admin)) return reply({ error: "Record not found." }, 404);
      const rows = await db.sql`INSERT INTO prayer_requests (journey_id, request_text) VALUES (${id}, ${requestText}) RETURNING id`;
      return reply({ prayer: { id: rows[0].id } }, 201);
    }
    if (method === "PATCH" && parts.length === 2 && parts[0] === "prayers") {
      const id = integerId(parts[1]);
      const body = await bodyOf(request);
      const requestText = typeof body?.requestText === "string" ? body.requestText.trim() : null;
      if (!id || (requestText === null && !["active", "answered"].includes(body?.status)) ||
        (requestText !== null && (!requestText || requestText.length > 1000))) return reply({ error: "Invalid prayer request." }, 400);
      const found = await db.sql`
        SELECT p.id FROM prayer_requests p JOIN journeys j ON j.id = p.journey_id
        WHERE p.id = ${id} AND (${admin} OR j.owner_user_id = ${user.id}
          OR (j.owner_user_id IS NULL AND lower(j.owner_email) = ${emailOf(user.email)})) LIMIT 1`;
      if (!found.length) return reply({ error: "Prayer request not found." }, 404);
      if (requestText !== null) await db.sql`UPDATE prayer_requests SET request_text = ${requestText} WHERE id = ${id}`;
      else await db.sql`UPDATE prayer_requests SET status = ${body.status} WHERE id = ${id}`;
      return reply({ saved: true });
    }
    if (method === "DELETE" && parts.length === 2 && parts[0] === "prayers") {
      const id = integerId(parts[1]);
      if (!id) return reply({ error: "Invalid prayer request." }, 400);
      const found = await db.sql`
        SELECT p.id FROM prayer_requests p JOIN journeys j ON j.id = p.journey_id
        WHERE p.id = ${id} AND (${admin} OR j.owner_user_id = ${user.id}
          OR (j.owner_user_id IS NULL AND lower(j.owner_email) = ${emailOf(user.email)})) LIMIT 1`;
      if (!found.length) return reply({ error: "Prayer request not found." }, 404);
      await db.sql`DELETE FROM prayer_requests WHERE id = ${id}`;
      return reply({ deleted: true });
    }
    return reply({ error: "Not found." }, 404);
  } catch (error) {
    console.error("Journey API unavailable", error);
    return reply({ error: "Records are temporarily unavailable. Please try again." }, 503);
  }
}
