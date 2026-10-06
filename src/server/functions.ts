import { createServerFn } from "@tanstack/react-start";
import { getCookie, setResponseHeader } from "@tanstack/react-start/server";
import { getDatabase } from "@netlify/database";
import { fetchIdentityUser, parseAdminEmails, resolveMember } from "./member";
import {
  addPrayer,
  createJourney,
  deleteJourney,
  deletePrayer,
  editJourney,
  editPrayer,
  fail,
  publicTotals,
  setPrayerStatus,
  setSalvationStatus,
  snapshot,
} from "./records";
import type { JourneyInput, PrayerStatus, Result, SalvationStatus, Totals } from "#/journeys/types";
import type { Member } from "./member";
import type { Sql } from "./records";

async function currentMember(): Promise<Result<Member>> {
  try {
    // The browser SDK of Netlify Identity keeps the access token in this cookie.
    const user = await fetchIdentityUser(
      getCookie("nf_jwt"),
      new URL("/.netlify/identity", process.env.URL).href,
    );

    return resolveMember(user, parseAdminEmails(process.env.ADMIN_EMAILS));
  } catch (error) {
    console.error("Identity unavailable", error);

    return fail(503, "Sign-in is temporarily unavailable.");
  }
}

async function asMember<Body>(
  run: (sql: Sql, member: Member) => Promise<Result<Body>>,
): Promise<Result<Body>> {
  setResponseHeader("Cache-Control", "no-store");

  const member = await currentMember();

  if (!member.ok) {
    return member;
  }

  try {
    return await run(getDatabase().sql, member.body);
  } catch (error) {
    console.error("Records unavailable", error);

    return fail(503, "Records are temporarily unavailable. Please try again.");
  }
}

const getPublicTotals = createServerFn({ method: "GET" }).handler(
  async (): Promise<Result<{ totals: Totals }>> => {
    setResponseHeader("Cache-Control", "no-store");

    try {
      return { ok: true, body: { totals: await publicTotals(getDatabase().sql) } };
    } catch (error) {
      console.error("Public totals unavailable", error);

      return fail(503, "Totals are temporarily unavailable.");
    }
  },
);

const getSnapshot = createServerFn({ method: "GET" }).handler(() => asMember(snapshot));

const createJourneyFn = createServerFn({ method: "POST" })
  .inputValidator((input: JourneyInput) => input)
  .handler(({ data }) => asMember((sql, member) => createJourney(sql, member, data)));

const editJourneyFn = createServerFn({ method: "POST" })
  .inputValidator((input: { id: number; journey: JourneyInput }) => input)
  .handler(({ data }) =>
    asMember((sql, member) => editJourney(sql, member, data.id, data.journey)),
  );

const setSalvationStatusFn = createServerFn({ method: "POST" })
  .inputValidator((input: { id: number; salvationStatus: SalvationStatus }) => input)
  .handler(({ data }) =>
    asMember((sql, member) => setSalvationStatus(sql, member, data.id, data.salvationStatus)),
  );

const deleteJourneyFn = createServerFn({ method: "POST" })
  .inputValidator((input: { id: number }) => input)
  .handler(({ data }) => asMember((sql, member) => deleteJourney(sql, member, data.id)));

const addPrayerFn = createServerFn({ method: "POST" })
  .inputValidator((input: { journeyId: number; requestText: string }) => input)
  .handler(({ data }) =>
    asMember((sql, member) => addPrayer(sql, member, data.journeyId, data.requestText)),
  );

const editPrayerFn = createServerFn({ method: "POST" })
  .inputValidator((input: { id: number; requestText: string }) => input)
  .handler(({ data }) =>
    asMember((sql, member) => editPrayer(sql, member, data.id, data.requestText)),
  );

const setPrayerStatusFn = createServerFn({ method: "POST" })
  .inputValidator((input: { id: number; status: PrayerStatus }) => input)
  .handler(({ data }) =>
    asMember((sql, member) => setPrayerStatus(sql, member, data.id, data.status)),
  );

const deletePrayerFn = createServerFn({ method: "POST" })
  .inputValidator((input: { id: number }) => input)
  .handler(({ data }) => asMember((sql, member) => deletePrayer(sql, member, data.id)));

const getSessionHint = createServerFn({ method: "GET" }).handler(
  (): { hasToken: boolean; language: "en" | "ko" } => ({
    hasToken: Boolean(getCookie("nf_jwt")),
    language: getCookie("soul-winning-language") === "ko" ? "ko" : "en",
  }),
);

export {
  addPrayerFn,
  createJourneyFn,
  deleteJourneyFn,
  deletePrayerFn,
  editJourneyFn,
  editPrayerFn,
  getPublicTotals,
  getSessionHint,
  getSnapshot,
  setPrayerStatusFn,
  setSalvationStatusFn,
};
