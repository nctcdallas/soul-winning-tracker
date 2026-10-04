import { getUser, handleAuthCallback, oauthLogin, logout } from "@netlify/identity";
import { localize, tr } from "./i18n.js";
import "./styles.css";

const root = document.querySelector("#app");
let savedLanguage = "en";
try {
  savedLanguage = localStorage.getItem("soul-winning-language") === "ko" ? "ko" : "en";
} catch {
  /* Storage may be unavailable. */
}
const state = {
  user: null,
  data: null,
  publicTotals: null,
  totalsError: "",
  tab: "overview",
  notice: "",
  busy: false,
  loading: false,
  drafts: {},
  editingJourney: null,
  editingPrayer: null,
  language: savedLanguage,
};
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );
const nameOf = (person) => escapeHtml(person.soulName);
const dateOf = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? ""
    : date.toLocaleDateString(state.language === "ko" ? "ko-KR" : "en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};
const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const encounterISO = (value) =>
  typeof value === "string"
    ? value.slice(0, 10)
    : value instanceof Date && !Number.isNaN(value.valueOf())
      ? value.toISOString().slice(0, 10)
      : "";
const encounterDateOf = (person) => {
  const value = encounterISO(person.encounterDate);
  return value ? dateOf(`${value}T12:00:00`) : tr("Date of encounter not set", state.language);
};
const statusOf = (person) =>
  person.salvationStatus === "saved" || person.salvation
    ? "saved"
    : ["declined", "interested", "praying"].includes(person.salvationStatus)
      ? person.salvationStatus
      : "praying";
const statusLabel = (status) =>
  tr(
    {
      declined: "Not interested at this time",
      interested: "Interested, but did not choose to receive Jesus",
      saved: "Chose to receive Jesus",
      praying: "Praying / follow-up",
    }[status] || "Praying / follow-up",
    state.language,
  );
const statusOptions = (selected = "declined") =>
  [
    ["declined", "Not interested at this time — Pray for this person"],
    ["interested", "Interested, but did not choose to receive Jesus — Pray for this person"],
    ["saved", "Chose to receive Jesus — Pray and follow up with this person"],
    ...(selected === "praying" ? [["praying", "Praying / follow-up (earlier record)"]] : []),
  ]
    .map(
      ([value, label]) =>
        `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`,
    )
    .join("");
const youtubeUrl = () =>
  state.language === "ko"
    ? "https://www.youtube.com/@nctc2022"
    : "https://www.youtube.com/@nctcdallas";
const prayerPrompt = (person) =>
  state.language === "ko"
    ? statusOf(person) === "saved"
      ? "이 분의 믿음의 여정을 위해 기도하고 후속 만남을 이어 가세요."
      : "이 분을 위해 기도해 주세요."
    : statusOf(person) === "saved"
      ? `Pray and follow up with ${nameOf(person)}.`
      : `Pray for ${nameOf(person)}.`;
const activeCount = (count) => (state.language === "ko" ? `${count}건 기도 중` : `${count} active`);
const answeredCount = (count) =>
  state.language === "ko"
    ? `${count}건 응답받음`
    : `${count} answered request${count === 1 ? "" : "s"}`;

async function api(path, method = "GET", body) {
  const response = await fetch(`/api/${path}`, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The request could not be completed.");
  return data;
}

function navButton(label, tab) {
  return `<button type="button" data-tab="${tab}" class="${state.tab === tab ? "active" : ""}">${label}</button>`;
}

function formKey(form) {
  return (
    form.id ||
    (form.dataset.editJourneyForm ? `journey:${form.dataset.editJourneyForm}` : "") ||
    (form.dataset.editPrayer ? `prayer-edit:${form.dataset.editPrayer}` : "") ||
    (form.dataset.prayerForm ? `prayer-new:${form.dataset.prayerForm}` : "")
  );
}

function rememberForms() {
  return [...root.querySelectorAll("form")].map((form) => ({
    key: formKey(form),
    fields: [...form.querySelectorAll("input, textarea, select")].map((field) => ({
      name: field.name,
      value: field.value,
      checked: field.checked,
      focused: field === document.activeElement,
      selectionStart:
        field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement
          ? field.selectionStart
          : null,
    })),
  }));
}

function restoreForms(forms) {
  for (const form of root.querySelectorAll("form")) {
    const saved = forms.find((item) => item.key && item.key === formKey(form));
    if (!saved) continue;
    const fields = [...form.querySelectorAll("input, textarea, select")];
    for (const [index, field] of fields.entries()) {
      const old = saved.fields[index];
      if (!old || old.name !== field.name) continue;
      field.value = old.value;
      if (field.type === "checkbox" || field.type === "radio") field.checked = old.checked;
      if (old.focused) {
        field.focus();
        if (old.selectionStart !== null)
          field.setSelectionRange(old.selectionStart, old.selectionStart);
      }
    }
  }
  const healingCheckbox = root.querySelector('#journey-form input[name="healing"]');
  root.querySelector("#healing-field")?.classList.toggle("hidden", !healingCheckbox?.checked);
}

function shell(content) {
  const viewer = state.data?.viewer;
  const forms = rememberForms();
  root.innerHTML = `<div class="site-shell">
    <header class="topbar"><div class="brand"><img class="brand-logo" src="/nctc-logo.png" alt="NCTC logo" /><span>Soul Winning Journey</span></div>
      ${viewer ? `<nav aria-label="Main navigation" class="nav">${navButton("Overview", "overview")}${navButton("My journey", "my-journey")}${navButton("Prayer list", "prayer-list")}${navButton("Record", "record")}${viewer.isLeader ? navButton("Team records", "team") : ""}</nav><div class="account"><span>${escapeHtml(viewer.displayName)}</span><button type="button" data-action="signout">Sign out</button></div>` : ""}
      <button type="button" class="language-toggle" data-action="language" aria-label="${state.language === "ko" ? "영어로 보기" : "한국어로 보기"}" title="${state.language === "ko" ? "영어로 보기" : "한국어로 보기"}"><span aria-hidden="true">${state.language === "ko" ? "🇺🇸" : "🇰🇷"}</span> ${state.language === "ko" ? "EN" : "한국어"}</button>
    </header><main class="page-content">${state.notice && (!state.user || state.data) ? `<p class="notice" role="status">${escapeHtml(state.notice)}</p>` : ""}${content}</main>
    <footer><span>New Creation Training Center · Training new creations, raising end-time soul winners.</span><span class="footer-links"><a href="https://www.nctcdallas.org/" target="_blank" rel="noopener noreferrer">About NCTC</a><a href="${youtubeUrl()}" target="_blank" rel="noopener noreferrer">NCTC on YouTube</a></span></footer></div>`;
  restoreForms(forms);
  localize(root, state.language);
}

function title(eyebrow, heading, description, action = false) {
  return `<div class="section-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${heading}</h1><p class="intro">${description}</p></div>${action ? `<button type="button" class="primary-button" data-tab="record">Record a person</button>` : ""}</div>`;
}

function totalsGrid(totals, personal = false) {
  const count = (key) =>
    totals && Number.isFinite(Number(totals[key])) ? Number(totals[key]).toLocaleString() : "—";
  return `<div class="stat-grid" aria-label="${personal ? "My outreach totals" : "Live ministry totals"}"><section class="hero-stat"><span>${personal ? "My outreach encounters" : "Outreach encounters recorded"}</span><strong>${count("reached")}</strong><small>${personal ? "From the encounters you recorded." : "Shared by participants worldwide."}</small></section><section class="small-stat"><span>${personal ? "Salvations I recorded" : "Salvations reported"}</span><strong>${count("salvations")}</strong></section><section class="small-stat"><span>${personal ? "Healings I recorded" : "Healings reported"}</span><strong>${count("healings")}</strong></section><section class="small-stat"><span>${personal ? "Holy Spirit baptisms I recorded" : "Holy Spirit baptisms reported"}</span><strong>${count("baptisms")}</strong></section></div>`;
}

function personalTotals(people) {
  return {
    reached: people.length,
    salvations: people.filter((person) => statusOf(person) === "saved").length,
    healings: people.filter((person) => person.healing === true).length,
    baptisms: people.filter((person) => person.holySpiritBaptism === true).length,
  };
}

function prayerRow(prayer) {
  const editing = Number(state.editingPrayer) === Number(prayer.id);
  if (editing)
    return `<form class="prayer-edit" data-edit-prayer="${prayer.id}"><label>Edit prayer request<textarea name="requestText" maxlength="1000" required rows="3">${escapeHtml(prayer.requestText)}</textarea></label><div class="record-actions"><button type="submit">Save request</button><button type="button" data-action="cancel-prayer-edit">Cancel</button></div></form>`;
  return `<div class="prayer-request ${prayer.status === "answered" ? "answered" : ""}"><p>${escapeHtml(prayer.requestText)}</p><div class="record-actions"><button type="button" data-prayer-id="${prayer.id}" data-prayer-status="${prayer.status === "answered" ? "active" : "answered"}">${prayer.status === "answered" ? "Reopen" : "Mark answered"}</button><button type="button" data-edit-prayer="${prayer.id}">Edit</button><button type="button" class="danger-link" data-delete-prayer="${prayer.id}">Remove</button></div></div>`;
}

function personCard(person, showRecorder = false) {
  const prayers = (state.data?.prayers || []).filter(
    (prayer) => Number(prayer.journeyId) === Number(person.id),
  );
  const active = prayers.filter((prayer) => prayer.status === "active");
  const answered = prayers.filter((prayer) => prayer.status === "answered");
  const editing = Number(state.editingJourney) === Number(person.id);
  return `<article class="person-card"><div class="person-head"><div class="person-initial">${nameOf(person).charAt(0).toUpperCase()}</div><div><h3>${nameOf(person)}</h3><p>${escapeHtml(person.location)} · ${encounterDateOf(person)}${showRecorder ? ` · ${tr("Recorded by", state.language)} ${escapeHtml(person.recorderName)} (${escapeHtml(person.recorderEmail || "")})` : ""}</p><p class="recorded-date">${tr("Recorded on", state.language)} ${dateOf(person.createdAt)}</p></div></div>
    <div class="record-actions record-toolbar"><button type="button" data-edit-journey="${person.id}">${editing ? "Close editor" : "Edit record"}</button><button type="button" class="danger-link" data-delete-journey="${person.id}">Remove record</button></div>
    ${editing ? `<form class="journey-edit" data-edit-journey-form="${person.id}"><div class="field-grid"><label class="encounter-name">Person reached<input name="soulName" required maxlength="100" value="${nameOf(person)}" /></label><label>Location<input name="location" required maxlength="160" value="${escapeHtml(person.location)}" /></label><label>Date of encounter<input name="encounterDate" type="date" max="${todayISO()}" value="${encounterISO(person.encounterDate)}" /></label></div><label>Response to the gospel<select name="salvationStatus">${statusOptions(statusOf(person))}</select></label><div class="choice-grid"><label><input name="healing" type="checkbox" ${person.healing ? "checked" : ""}/> Healing reported</label><label><input name="holySpiritBaptism" type="checkbox" ${person.holySpiritBaptism ? "checked" : ""}/> Holy Spirit baptism reported</label></div><label>Healing details (optional)<textarea name="healingDetails" maxlength="1000" rows="3">${escapeHtml(person.healingDetails || "")}</textarea></label><button type="submit" class="primary-button">Save changes</button></form>` : ""}
    <div class="person-details"><label>Response to the gospel<select data-status-id="${person.id}" aria-label="Response to the gospel for ${nameOf(person)}">${statusOptions(statusOf(person))}</select></label><div class="pills">${person.healing ? "<span>Healing</span>" : ""}${person.holySpiritBaptism ? "<span>Holy Spirit baptism</span>" : ""}</div></div>
    ${person.healing && person.healingDetails ? `<p class="healing"><strong>Healing details:</strong> ${escapeHtml(person.healingDetails)}</p>` : ""}
    <div class="prayer-section"><div class="prayer-heading"><h4>Intercessory prayer</h4><span>${activeCount(active.length)}</span></div>
    ${!prayers.length ? `<p class="prayer-default">${prayerPrompt(person)}</p>` : ""}
    ${active.map(prayerRow).join("")}
    ${answered.map(prayerRow).join("")}
    <form data-prayer-form="${person.id}" class="add-prayer"><label for="prayer-${person.id}">Add a prayer request</label><div><input id="prayer-${person.id}" name="requestText" maxlength="1000" required placeholder="${state.language === "ko" ? "기도 제목을 입력하세요" : `Prayer request for ${nameOf(person)}`}" value="${escapeHtml(state.drafts[person.id] || "")}"/><button type="submit">Add request</button></div></form></div></article>`;
}

function peopleList(people, showRecorder = false) {
  return people.length
    ? `<div class="people-list">${people.map((person) => personCard(person, showRecorder)).join("")}</div>`
    : `<div class="empty-state"><h3>No people recorded yet</h3><p>Record someone you reached to begin your journey and prayer list.</p><button type="button" class="text-button" data-tab="record">Record a person</button></div>`;
}

function prayerList(people) {
  if (!people.length) return peopleList(people);
  return `<div class="prayer-list">${people
    .map((person) => {
      const prayers = (state.data?.prayers || []).filter(
        (prayer) => Number(prayer.journeyId) === Number(person.id),
      );
      const active = prayers.filter((prayer) => prayer.status === "active");
      const answered = prayers.filter((prayer) => prayer.status === "answered");
      return `<article class="prayer-card"><div class="prayer-heading"><div><h3 translate="no">${nameOf(person)}</h3><p>${escapeHtml(person.location)} · ${encounterDateOf(person)}</p><p>${statusLabel(statusOf(person))}</p></div><span>${activeCount(active.length)}</span></div>${!active.length ? `<p class="prayer-default">${prayerPrompt(person)}</p>` : active.map(prayerRow).join("")}${answered.length ? `<details><summary>${answeredCount(answered.length)}</summary>${answered.map(prayerRow).join("")}</details>` : ""}<form data-prayer-form="${person.id}" class="add-prayer"><label for="prayer-focus-${person.id}">Add a prayer request</label><div><input id="prayer-focus-${person.id}" name="requestText" maxlength="1000" required placeholder="Prayer request" value="${escapeHtml(state.drafts[person.id] || "")}"/><button type="submit">Add request</button></div></form></article>`;
    })
    .join("")}</div>`;
}

function render() {
  if (!state.user) {
    shell(`<section class="public-welcome">
      <div class="public-totals">
        ${state.language === "ko" ? '<h1 class="ko-impact-title">NCTC 전도 현황</h1><p class="ko-impact-subtitle">실시간 집계 · 2026년 10월부터</p>' : '<h1 class="eyebrow">LIVE SOUL-WINNING IMPACT · SINCE OCTOBER 2026</h1>'}
        ${totalsGrid(state.publicTotals)}
        <p class="totals-note">These are self-reported entries and may include repeat encounters. Counts update automatically; personal details are never shown publicly.</p>
        ${state.totalsError ? `<p class="totals-note" role="status">${escapeHtml(state.totalsError)}</p>` : ""}
      </div>
      <div class="public-signin"><div><h2>Start your soul-winning journey</h2><p>Anyone with a Google account can participate—no approval needed. Record an encounter, track follow-up, and keep a private prayer list.</p></div><button type="button" class="primary-button" data-action="signin">Continue with Google</button></div>
      <div class="public-intro">
        <p class="eyebrow">NEW CREATION TRAINING CENTER · WORLDWIDE OUTREACH</p>
        <h2 class="mission-title">Be trained. Reach people. Keep praying.</h2>
        <p class="intro">NCTC exists to train new creations and raise end-time soul winners. Learn with our worldwide community, then use Soul Winning Journey to record outreach, remember each person, and follow up in prayer.</p>
        <div class="public-links"><a href="${youtubeUrl()}" target="_blank" rel="noopener noreferrer">Learn with NCTC on YouTube ↗</a><a href="https://www.nctcdallas.org/" target="_blank" rel="noopener noreferrer">Learn about NCTC ↗</a></div>
      </div>
      <section class="privacy-panel"><h2>Your records stay private</h2><p>Only you and NCTC admins can see the names, locations, healing details, and prayer requests you record. Other participants see aggregate totals only. Use a first name or initials when possible, share only details the person is comfortable having recorded, and correct or remove an entry from your journey at any time.</p></section>
    </section>`);
    return;
  }
  if (state.user.provider !== "google") {
    shell(
      `<section class="welcome"><h1>Google sign-in required</h1><p>Please sign out and choose Continue with Google.</p><button type="button" class="primary-button" data-action="signout">Sign out</button></section>`,
    );
    return;
  }
  if (!state.data) {
    shell(
      state.notice
        ? `<section class="welcome"><h1>We couldn’t open your journey.</h1><p>${escapeHtml(state.notice)}</p><div class="error-actions"><button type="button" class="primary-button" data-action="retry">Try again</button><button type="button" class="text-button" data-action="signout">Sign out</button></div></section>`
        : `<section class="welcome"><h1>Opening your journey…</h1><p>Checking your records.</p></section>`,
    );
    return;
  }
  const mine = state.data.mine || [];
  const prayers = state.data.prayers || [];
  const active = prayers.filter(
    (prayer) =>
      prayer.status === "active" &&
      mine.some((person) => Number(person.id) === Number(prayer.journeyId)),
  ).length;
  const answered = prayers.filter(
    (prayer) =>
      prayer.status === "answered" &&
      mine.some((person) => Number(person.id) === Number(prayer.journeyId)),
  ).length;
  const viewer = state.data.viewer;
  let content = "";
  if (state.tab === "overview") {
    content =
      title(
        "YOUR JOURNEY",
        "Every person matters.",
        "NCTC is raising end-time soul winners worldwide. Keep your outreach encounters and prayer follow-up together.",
        true,
      ) +
      `<div class="member-summary"><section><span>My encounters recorded</span><strong>${mine.length}</strong></section><section><span>Active prayer requests</span><strong>${active}</strong></section><section><span>Answered prayers</span><strong>${answered}</strong></section></div>` +
      `<h2 class="section-label">Ministry totals</h2>${totalsGrid(state.data.totals)}` +
      `<p class="totals-note">Community totals are self-reported and may include repeat encounters. Names and requests are private to each recorder and NCTC admins.</p><section class="activity"><p class="eyebrow">RECENTLY RECORDED</p><h2>My people</h2>${
        mine.length
          ? mine
              .slice(0, 3)
              .map(
                (person) =>
                  `<div class="journey-row"><span class="person-initial">${nameOf(person).charAt(0).toUpperCase()}</span><div><strong>${nameOf(person)}</strong> · ${statusLabel(statusOf(person))}<small>${escapeHtml(person.location)} · ${encounterDateOf(person)}</small></div></div>`,
              )
              .join("")
          : `<p>Your first recorded person will appear here and on your prayer list.</p>`
      }</section><section class="training-panel"><h2>Keep growing as a soul winner</h2><p>Learn and be encouraged through NCTC’s worldwide YouTube community.</p><a href="${youtubeUrl()}" target="_blank" rel="noopener noreferrer">Watch NCTC on YouTube ↗</a></section>`;
  } else if (state.tab === "my-journey") {
    content =
      title(
        "PERSONAL RECORDS",
        "My journey",
        "Only you and NCTC admins can see these names and requests. You can correct or remove your entries here.",
        true,
      ) +
      `<section class="personal-totals"><h2 class="section-label">My outreach totals</h2>${totalsGrid(personalTotals(mine), true)}<p class="totals-note">These totals use only your records and may include repeat encounters.</p></section>` +
      `<h2 class="section-label">People I recorded</h2>${peopleList(mine)}`;
  } else if (state.tab === "prayer-list") {
    content =
      title(
        "INTERCESSORY PRAYER",
        "My prayer list",
        "Everyone you record appears here automatically. Focus on active requests, add updates, and remember answered prayers.",
      ) + prayerList(mine);
  } else if (state.tab === "team" && viewer.isLeader) {
    content =
      title(
        "ADMIN VIEW",
        "Team records",
        "Review encounters and prayer follow-up across the ministry team.",
      ) + peopleList(state.data.team || [], true);
  } else if (state.tab === "record") {
    content =
      title(
        "RECORD AN ENCOUNTER",
        "Share an encounter.",
        "Make one entry for each outreach encounter you personally took part in. The person will be added to your private prayer list.",
      ) +
      `<form id="journey-form" class="record-card"><p class="recording-as">Recording as <strong>${escapeHtml(viewer.displayName)}</strong> (${escapeHtml(viewer.email)})</p><h2>01 · The encounter</h2><div class="field-grid"><label class="encounter-name">Person reached<input name="soulName" required maxlength="100" placeholder="First name or initials" /></label><label>Location<input name="location" required maxlength="160" placeholder="City, neighborhood, or event" /></label><label>Date of encounter<input name="encounterDate" type="date" required max="${todayISO()}" value="${todayISO()}" /></label></div><h2>02 · What happened?</h2><label class="status-field">Response to the gospel<select name="salvationStatus">${statusOptions()}</select></label><div class="choice-grid"><label><input name="healing" type="checkbox" /> Healing reported</label><label><input name="holySpiritBaptism" type="checkbox" /> Holy Spirit baptism reported</label></div><label id="healing-field" class="healing-field hidden">Healing details (optional)<textarea name="healingDetails" maxlength="1000" rows="4" placeholder="Describe only what the person is comfortable having recorded."></textarea></label><div class="form-footer"><p>Only you and NCTC admins can see this entry. Use a first name or initials when possible, and avoid sensitive details without the person’s permission.</p><button type="submit" class="primary-button">Save encounter</button></div></form>`;
  }
  shell(content);
}

async function refresh() {
  if (!state.user || state.user.provider !== "google" || state.loading) return false;
  state.loading = true;
  let succeeded = false;
  try {
    state.data = await api("journeys");
    state.notice = "";
    succeeded = true;
  } catch (error) {
    state.notice = error.message;
  } finally {
    state.loading = false;
    render();
  }
  return succeeded;
}

async function refreshPublicTotals() {
  if (state.user) return;
  try {
    state.publicTotals = (await api("totals")).totals;
    state.totalsError = "";
  } catch {
    state.totalsError = "Live totals are temporarily unavailable.";
  }
  if (!state.user) render();
}

async function mutation(action, success) {
  if (state.busy) return;
  state.busy = true;
  let completed = false;
  try {
    await action();
    if ((await refresh()) === false)
      throw new Error("Saved, but the latest records could not be loaded. Please try again.");
    state.notice = success;
    completed = true;
  } catch (error) {
    state.notice = error.message;
  } finally {
    state.busy = false;
    render();
  }
  return completed;
}

root.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.action === "language") {
    state.language = state.language === "ko" ? "en" : "ko";
    try {
      localStorage.setItem("soul-winning-language", state.language);
    } catch {
      /* Storage may be unavailable. */
    }
    render();
    return;
  }
  if (button.dataset.tab) {
    state.tab = button.dataset.tab;
    state.notice = "";
    state.editingJourney = null;
    state.editingPrayer = null;
    render();
    return;
  }
  if (button.dataset.action === "signin") {
    oauthLogin("google");
    return;
  }
  if (button.dataset.action === "signout") {
    await logout();
    state.user = null;
    state.data = null;
    render();
    void refreshPublicTotals();
    return;
  }
  if (button.dataset.action === "retry") {
    state.notice = "";
    render();
    await refresh();
    return;
  }
  if (button.dataset.action === "cancel-prayer-edit") {
    state.editingPrayer = null;
    render();
    return;
  }
  if (button.dataset.editJourney) {
    state.editingJourney =
      Number(state.editingJourney) === Number(button.dataset.editJourney)
        ? null
        : button.dataset.editJourney;
    render();
    return;
  }
  if (button.dataset.editPrayer) {
    state.editingPrayer = button.dataset.editPrayer;
    render();
    return;
  }
  if (button.dataset.deleteJourney) {
    if (
      !window.confirm(
        tr(
          "Remove this encounter and all its prayer requests? This cannot be undone.",
          state.language,
        ),
      )
    )
      return;
    if (
      await mutation(
        () => api(`journeys/${button.dataset.deleteJourney}`, "DELETE"),
        "Encounter and its prayer requests removed.",
      )
    )
      state.editingJourney = null;
    return;
  }
  if (button.dataset.deletePrayer) {
    if (!window.confirm(tr("Remove this prayer request? This cannot be undone.", state.language)))
      return;
    await mutation(
      () => api(`prayers/${button.dataset.deletePrayer}`, "DELETE"),
      "Prayer request removed.",
    );
    return;
  }
  if (button.dataset.prayerId) {
    await mutation(
      () =>
        api(`prayers/${button.dataset.prayerId}`, "PATCH", { status: button.dataset.prayerStatus }),
      "Prayer request updated.",
    );
  }
});

root.addEventListener("change", async (event) => {
  if (event.target.name === "healing")
    document.querySelector("#healing-field")?.classList.toggle("hidden", !event.target.checked);
  if (event.target.dataset.statusId)
    await mutation(
      () =>
        api(`journeys/${event.target.dataset.statusId}`, "PATCH", {
          salvationStatus: event.target.value,
        }),
      "Salvation status updated.",
    );
});

root.addEventListener("input", (event) => {
  if (event.target.name === "requestText") {
    const form = event.target.closest("form[data-prayer-form]");
    if (form) state.drafts[form.dataset.prayerForm] = event.target.value;
  }
});

root.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  if (form.id === "journey-form") {
    const data = new FormData(form);
    await mutation(
      () =>
        api("journeys", "POST", {
          soulName: String(data.get("soulName") || ""),
          location: String(data.get("location") || ""),
          encounterDate: String(data.get("encounterDate") || ""),
          salvationStatus: String(data.get("salvationStatus") || "declined"),
          healing: data.has("healing"),
          holySpiritBaptism: data.has("holySpiritBaptism"),
          healingDetails: String(data.get("healingDetails") || ""),
        }),
      "Person saved to your journey and prayer list.",
    );
    if (state.notice.startsWith("Person saved")) state.tab = "my-journey";
    render();
  } else if (form.dataset.editJourneyForm) {
    const id = form.dataset.editJourneyForm;
    const data = new FormData(form);
    if (
      await mutation(
        () =>
          api(`journeys/${id}`, "PATCH", {
            edit: true,
            soulName: String(data.get("soulName") || ""),
            location: String(data.get("location") || ""),
            encounterDate: String(data.get("encounterDate") || ""),
            salvationStatus: String(data.get("salvationStatus") || "declined"),
            healing: data.has("healing"),
            holySpiritBaptism: data.has("holySpiritBaptism"),
            healingDetails: String(data.get("healingDetails") || ""),
          }),
        "Encounter updated.",
      )
    ) {
      state.editingJourney = null;
      render();
    }
  } else if (form.dataset.editPrayer) {
    const id = form.dataset.editPrayer;
    const data = new FormData(form);
    if (
      await mutation(
        () => api(`prayers/${id}`, "PATCH", { requestText: String(data.get("requestText") || "") }),
        "Prayer request updated.",
      )
    ) {
      state.editingPrayer = null;
      render();
    }
  } else if (form.dataset.prayerForm) {
    const id = form.dataset.prayerForm;
    const data = new FormData(form);
    await mutation(
      () =>
        api(`journeys/${id}/prayers`, "POST", {
          requestText: String(data.get("requestText") || ""),
        }),
      "Prayer request added.",
    );
    if (state.notice.startsWith("Prayer request added")) delete state.drafts[id];
    render();
  }
});

async function start() {
  try {
    await handleAuthCallback();
  } catch (error) {
    state.notice = error.message || "Could not complete sign-in.";
  }
  try {
    state.user = await getUser();
  } catch {
    state.user = null;
  }
  render();
  if (state.user) await refresh();
  else await refreshPublicTotals();
  window.setInterval(() => {
    if (!document.hidden && !state.busy) void (state.user ? refresh() : refreshPublicTotals());
  }, 5000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !state.busy) void (state.user ? refresh() : refreshPublicTotals());
  });
}

void start();
