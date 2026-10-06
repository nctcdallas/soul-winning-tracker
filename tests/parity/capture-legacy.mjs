// Records what netlify/functions/journey-v2.mjs returns for every scenario step.
// Run it only at a commit that still has that function: `node tests/parity/capture-legacy.mjs`.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { NetlifyDB } from "@netlify/database-dev";
import { ADMIN_EMAILS, actors, normalize, seedSql, steps } from "./scenario.mjs";

process.env.TZ = "UTC";
process.env.ADMIN_EMAILS = ADMIN_EMAILS;

const database = new NetlifyDB({ logger: () => {} });
process.env.NETLIFY_DB_URL = await database.start();
await database.applyMigrations(
  fileURLToPath(new URL("../../netlify/database/migrations", import.meta.url)),
);
await database.exec(seedSql);

const { default: handler } = await import("../../netlify/functions/journey-v2.mjs");

const requests = {
  totals: () => ["GET", "totals"],
  snapshot: () => ["GET", "journeys"],
  createJourney: (body) => ["POST", "journeys", body],
  editJourney: (id, body) => ["PATCH", `journeys/${id}`, { edit: true, ...body }],
  setStatus: (id, salvationStatus) => ["PATCH", `journeys/${id}`, { salvationStatus }],
  deleteJourney: (id) => ["DELETE", `journeys/${id}`],
  addPrayer: (journeyId, requestText) => ["POST", `journeys/${journeyId}/prayers`, { requestText }],
  editPrayer: (id, requestText) => ["PATCH", `prayers/${id}`, { requestText }],
  setPrayerStatus: (id, status) => ["PATCH", `prayers/${id}`, { status }],
  deletePrayer: (id) => ["DELETE", `prayers/${id}`],
};

function signInAs(actor) {
  globalThis.netlifyIdentityContext = actor
    ? {
        user: {
          sub: actor.sub,
          email: actor.email,
          app_metadata: { provider: actor.provider },
          user_metadata: actor.name ? { full_name: actor.name } : {},
        },
      }
    : undefined;
}

const outcomes = [];

for (const step of steps) {
  const [method, path, body] = requests[step.op](...(step.args ?? []));
  signInAs(actors[step.as]);

  const response = await handler(
    new Request(`https://nctcsoulwinning.org/api/${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
  const payload = await response.json();

  outcomes.push({
    as: step.as,
    op: step.op,
    ...(response.ok ? {} : { status: response.status }),
    body: normalize(payload),
  });
}

writeFileSync(new URL("./golden.json", import.meta.url), `${JSON.stringify(outcomes, null, 2)}\n`);
console.log(`Captured ${outcomes.length} outcomes from the legacy function.`);
await database.stop();
process.exit(0);
