const ADMIN_EMAILS = "Admin@NCTC.test";

interface Actor {
  sub: string;
  email?: string;
  provider: string;
  name?: string;
}

interface Step {
  as: keyof typeof actors;
  op: string;
  args?: unknown[];
}

const actors: Record<string, Actor | null> = {
  anon: null,
  alice: { sub: "user-alice", email: "Alice@Example.com", provider: "google", name: "Alice" },
  bob: { sub: "user-bob", email: "bob@example.com", provider: "google" },
  admin: { sub: "user-admin", email: "admin@nctc.test", provider: "google", name: "Admin" },
  emailUser: { sub: "user-email", email: "pw@example.com", provider: "email" },
  noEmail: { sub: "user-noemail", provider: "google" },
};

// Journey 1 is an unclaimed record that alice may claim by email. Journey 2 belongs to nobody in the scenario.
const seedSql = `
  INSERT INTO journeys (owner_email, recorder_name, soul_name, location, salvation_status)
  VALUES ('alice@example.com', 'Alice (legacy)', 'Legacy Lee', 'Dallas', 'praying'),
         ('carol@example.com', 'Carol', 'Unclaimed Uma', 'Seoul', 'declined');
`;

const journey = (overrides = {}) => ({
  soulName: "  Grace  ",
  location: " Plano, TX ",
  encounterDate: "2026-10-01",
  salvationStatus: "saved",
  healing: true,
  holySpiritBaptism: false,
  healingDetails: "  Knee pain left.  ",
  ...overrides,
});

const steps: Step[] = [
  { as: "anon", op: "totals" },
  { as: "anon", op: "snapshot" },
  { as: "emailUser", op: "snapshot" },
  { as: "noEmail", op: "snapshot" },
  { as: "bob", op: "snapshot" },
  { as: "bob", op: "setStatus", args: [1, "saved"] },
  { as: "alice", op: "setStatus", args: [1, "interested"] },
  { as: "alice", op: "snapshot" },

  { as: "alice", op: "createJourney", args: [journey()] },
  { as: "alice", op: "createJourney", args: [null] },
  { as: "alice", op: "createJourney", args: [journey({ soulName: "   " })] },
  { as: "alice", op: "createJourney", args: [journey({ location: "" })] },
  { as: "alice", op: "createJourney", args: [journey({ encounterDate: "2026-02-30" })] },
  { as: "alice", op: "createJourney", args: [journey({ encounterDate: "" })] },
  { as: "alice", op: "createJourney", args: [journey({ salvationStatus: "unknown" })] },
  { as: "alice", op: "createJourney", args: [journey({ healing: "yes" })] },
  { as: "alice", op: "createJourney", args: [journey({ soulName: "x".repeat(101) })] },
  { as: "alice", op: "createJourney", args: [journey({ location: "x".repeat(161) })] },
  { as: "alice", op: "createJourney", args: [journey({ healingDetails: "x".repeat(1001) })] },
  {
    as: "bob",
    op: "createJourney",
    args: [
      journey({
        soulName: "한나",
        salvationStatus: "declined",
        healing: false,
        holySpiritBaptism: true,
      }),
    ],
  },
  { as: "bob", op: "snapshot" },

  { as: "bob", op: "editJourney", args: [3, journey({ soulName: "Hijacked" })] },
  { as: "bob", op: "setStatus", args: [3, "declined"] },
  { as: "bob", op: "deleteJourney", args: [3] },
  { as: "bob", op: "addPrayer", args: [3, "Not mine"] },

  { as: "alice", op: "addPrayer", args: [3, "  Pray for strength  "] },
  { as: "alice", op: "addPrayer", args: [3, "   "] },
  { as: "alice", op: "addPrayer", args: [3, "x".repeat(1001)] },
  { as: "alice", op: "addPrayer", args: ["abc", "Bad id"] },
  { as: "alice", op: "addPrayer", args: [999, "No such journey"] },

  { as: "bob", op: "editPrayer", args: [1, "Hijacked"] },
  { as: "bob", op: "setPrayerStatus", args: [1, "answered"] },
  { as: "bob", op: "deletePrayer", args: [1] },

  { as: "alice", op: "setPrayerStatus", args: [1, "answered"] },
  { as: "alice", op: "setPrayerStatus", args: [1, "bogus"] },
  { as: "alice", op: "editPrayer", args: [1, "  Updated request  "] },
  { as: "alice", op: "editPrayer", args: [1, "   "] },
  { as: "alice", op: "editPrayer", args: [1, "x".repeat(1001)] },
  { as: "alice", op: "editPrayer", args: [999, "No such prayer"] },
  { as: "alice", op: "editPrayer", args: ["abc", "Bad id"] },

  {
    as: "alice",
    op: "editJourney",
    args: [
      3,
      journey({
        soulName: "Grace L.",
        encounterDate: "",
        salvationStatus: "praying",
        healing: false,
      }),
    ],
  },
  { as: "alice", op: "editJourney", args: [3, journey({ encounterDate: "not-a-date" })] },
  { as: "alice", op: "editJourney", args: [3, journey({ holySpiritBaptism: "no" })] },
  { as: "alice", op: "editJourney", args: [0, journey()] },
  { as: "alice", op: "editJourney", args: [999, journey()] },
  { as: "alice", op: "setStatus", args: [3, "bogus"] },
  { as: "alice", op: "setStatus", args: [2, "saved"] },
  { as: "alice", op: "snapshot" },

  { as: "admin", op: "snapshot" },
  { as: "admin", op: "editPrayer", args: [1, "Admin edit"] },
  { as: "admin", op: "setStatus", args: [4, "saved"] },
  { as: "admin", op: "editJourney", args: [2, journey({ soulName: "Uma", healing: false })] },

  { as: "bob", op: "addPrayer", args: [4, "Bob's request"] },
  { as: "alice", op: "snapshot" },
  { as: "alice", op: "deleteJourney", args: [3] },
  { as: "alice", op: "deleteJourney", args: [3] },
  { as: "alice", op: "deleteJourney", args: ["abc"] },
  { as: "alice", op: "snapshot" },

  { as: "bob", op: "deletePrayer", args: [2] },
  { as: "bob", op: "deletePrayer", args: [2] },
  { as: "bob", op: "deletePrayer", args: ["abc"] },
  { as: "bob", op: "snapshot" },

  { as: "anon", op: "totals" },
  { as: "admin", op: "snapshot" },
];

const ID_KEYS = new Set(["id", "journeyId"]);

// Timestamps change per run, and the pg driver returns BIGINT as a string and DATE as a Date.
function normalize(value: unknown, key?: string): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalize(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([entryKey, entry]) => [entryKey, normalize(entry, entryKey)]),
    );
  }

  if (key === "createdAt") {
    return "<timestamp>";
  }

  if (key === "encounterDate" && typeof value === "string") {
    return value.slice(0, 10);
  }

  if (key !== undefined && ID_KEYS.has(key) && /^\d+$/.test(String(value))) {
    return Number(value);
  }

  return value;
}

export { ADMIN_EMAILS, actors, normalize, seedSql, steps };
export type { Actor, Step };
