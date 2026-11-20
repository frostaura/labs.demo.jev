"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

// ---------- Stage scaling and navigation ----------

const stage = $("#stage");
const slides = $$(".slide");
let current = 0;

function fit() {
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

function show(index) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  slides.forEach((slide, i) => slide.classList.toggle("active", i === current));
  $("#count").textContent = `${current + 1} / ${slides.length}`;
  $("#slide-title").textContent = slides[current].dataset.title ?? "";
  $("#prev").disabled = current === 0;
  $("#next").disabled = current === slides.length - 1;
  $("#progress").style.width = `${((current + 1) / slides.length) * 100}%`;
  history.replaceState(null, "", `#${current + 1}`);
}

function isTyping(target) {
  return target instanceof HTMLElement && target.matches("input, textarea, select");
}

document.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (isTyping(event.target)) {
    if (event.key === "Escape") event.target.blur();
    return;
  }
  const onButton = event.target instanceof HTMLButtonElement;
  switch (event.key) {
    case "ArrowRight": case "PageDown": show(current + 1); break;
    case "ArrowLeft": case "PageUp": show(current - 1); break;
    case " ": if (onButton) return; show(current + 1); break;
    case "Home": show(0); break;
    case "End": show(slides.length - 1); break;
    case "f": case "F":
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => { /* the browser said no; stay windowed */ });
      break;
    case "c": case "C": toggleTheme(); break;
    default: return;
  }
  event.preventDefault();
});

$("#prev").addEventListener("click", () => show(current - 1));
$("#next").addEventListener("click", () => show(current + 1));
window.addEventListener("resize", fit);
window.addEventListener("hashchange", () => show(Number(location.hash.slice(1)) - 1 || 0));

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch { /* private window: the choice just won't persist */ }
}
try {
  const saved = localStorage.getItem("theme");
  if (saved) document.documentElement.dataset.theme = saved;
} catch { /* storage unavailable: default theme */ }

// ---------- Code highlighting (tiny, dependency-free) ----------

const KEYWORDS = {
  py: ["import", "from", "for", "in", "print", "def", "return"],
  cs: ["public", "enum", "var", "new", "await", "double", "string", "object"],
};

function highlight(pre) {
  const comment = pre.dataset.lang === "py" ? /#.*/ : /\/\/.*/;
  const words = KEYWORDS[pre.dataset.lang] ?? [];
  const pattern = new RegExp(`(${comment.source})|("(?:[^"\\\\]|\\\\.)*")|\\b(${words.join("|")})\\b`, "g");
  const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let html = "";
  let last = 0;
  const source = pre.textContent;
  for (const match of source.matchAll(pattern)) {
    html += escape(source.slice(last, match.index));
    const kind = match[1] ? "c" : match[2] ? "s" : "k";
    html += `<span class="${kind}">${escape(match[0])}</span>`;
    last = match.index + match[0].length;
  }
  pre.innerHTML = html + escape(source.slice(last));
}

// ---------- Talk, speaker, sponsors ----------

function fillText(selector, value) {
  $$(selector).forEach((node) => {
    node.textContent = value ?? "";
    if (!value) node.hidden = true;
  });
}

function renderTalk({ talk, sponsors, jev }) {
  document.title = talk.title || document.title;
  fillText('[data-talk="title"]', talk.title);
  fillText('[data-talk="subtitle"]', talk.subtitle);
  fillText('[data-talk="event"]', talk.event);
  fillText('[data-speaker="name"]', talk.speaker.name);
  fillText('[data-speaker="role"]', talk.speaker.role);
  fillText('[data-speaker="links"]', talk.speaker.links.join("  ·  "));
  $$('[data-speaker="bio"]').forEach((node) => node.replaceChildren(...talk.speaker.bio.map((line) => el("div", { textContent: line }))));
  $$('[data-speaker="photo"]').forEach((img) => {
    if (!talk.speaker.photo) return;
    img.src = talk.speaker.photo;
    img.alt = talk.speaker.name;
    img.hidden = false;
  });

  const status = $("#status");
  status.textContent = jev.ready ? `● ${jev.model}` : "○ no API key";
  status.classList.toggle("off", !jev.ready);

  if (sponsors.items.length === 0) return;
  $$(".sponsors").forEach((strip) => {
    $('[data-sponsors="heading"]', strip).textContent = sponsors.heading;
    // Repeat the set until one run is wider than the stage, then double it so the loop is seamless.
    const repeats = Math.max(1, Math.ceil(1920 / (sponsors.items.length * 340)));
    const run = Array.from({ length: repeats }, () => sponsors.items).flat();
    const track = $(".track", strip);
    track.replaceChildren(...[...run, ...run].map((sponsor) =>
      el("div", { className: "logo", title: sponsor.name }, el("img", { src: sponsor.image, alt: sponsor.name }))));
    track.style.animationDuration = `${run.length * sponsors.secondsPerLogo}s`;
    strip.hidden = false;
  });
}

// ---------- Talking to the backend ----------

async function post(url, body) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error ?? `The server answered ${response.status}.`);
  return payload;
}

const percent = (value) => `${(value * 100).toFixed(1)}%`;
const money = (value) => (value == null ? "cost n/a" : `$${Number(value).toFixed(7).replace(/0+$/, "").replace(/\.$/, ".0")}`);
const pretty = (name) => name.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").toLowerCase();

function bar(label, probability, chosen) {
  return el("div", { className: `bar${chosen ? " chosen" : ""}` },
    el("span", { className: "label", textContent: label }),
    el("span", { className: "track" }, el("span", { className: "fill", style: `width:${Math.max(0, Math.min(1, probability)) * 100}%` })),
    el("span", { className: "pct", textContent: percent(probability) }));
}

/** Draws one typed answer — yes/no, choice or score — as probability bars. */
function renderAnswer(name, answer, truth) {
  const box = el("div", { className: "answer" }, el("div", { className: "name", textContent: pretty(name) }));
  let verdict = null;

  if (answer.type === "noul") {
    verdict = answer.noul >= 0.5;
    box.append(el("div", { className: "verdict", textContent: verdict ? "Yes" : "No" }),
      bar("yes", answer.noul, verdict), bar("no", 1 - answer.noul, !verdict));
  } else if (answer.type === "choice") {
    verdict = answer.choice;
    box.append(el("div", { className: "verdict", textContent: pretty(answer.choice) }));
    Object.entries(answer.probabilities ?? { [answer.choice]: 1 })
      .sort((a, b) => b[1] - a[1])
      .forEach(([option, probability]) => box.append(bar(pretty(option), probability, option === answer.choice)));
  } else if (answer.type === "score") {
    const legend = answer.legend ?? {};
    const top = Math.max(1, Object.keys(answer.probabilities ?? legend).length - 1);
    box.append(el("div", { className: "verdict", textContent: `${answer.score.toFixed(2)} of ${top}` }));
    Object.entries(answer.probabilities ?? {}).forEach(([index, probability]) =>
      box.append(bar(String(legend[index] ?? index).split(":")[0], probability, Number(index) === Math.round(answer.score))));
  } else {
    box.append(el("div", { className: "verdict", textContent: answer.type === "refusal" ? "Jev declined to answer" : JSON.stringify(answer) }));
  }

  if (truth !== undefined && verdict !== null) {
    const right = verdict === truth;
    const shown = typeof truth === "boolean" ? (truth ? "yes" : "no") : truth;
    box.append(el("div", { className: `truth ${right ? "ok" : "miss"}`, textContent: `${right ? "✓ Correct" : "✗ Wrong"} — what really happened: ${shown}` }));
  }
  return box;
}

function renderMeta(result) {
  const pills = [
    el("span", { className: `pill ${result.cached ? "cached" : "live"}`, textContent: result.cached ? "REPLAY (offline)" : "LIVE" }),
    el("span", { className: "pill", textContent: `${Math.round(result.latencyMs)} ms` }),
  ];
  if (result.usage?.input_tokens != null) pills.push(el("span", { className: "pill", textContent: `${result.usage.input_tokens} tokens read` }));
  if (result.usage?.cost != null) {
    pills.push(el("span", { className: "pill", textContent: money(result.usage.cost) }));
    pills.push(el("span", { className: "pill", textContent: `≈ $${(result.usage.cost * 1000).toFixed(2)} per 1,000 decisions` }));
  }
  return el("div", { className: "meta" }, ...pills);
}

/** Wires a Run button to an async action that fills the result pane. */
function runner(button, output, action) {
  const idle = button.textContent;
  button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = "Deciding…";
    try {
      output.replaceChildren(...await action());
    } catch (error) {
      output.replaceChildren(el("div", { className: "error", textContent: error.message }));
    } finally {
      button.disabled = false;
      button.textContent = idle;
    }
  });
}

function resultPane(title = "Jev's decision") {
  const output = el("div", { style: "display:flex;flex-direction:column;flex:1;min-height:0" },
    el("div", { className: "placeholder", textContent: "Press the button to ask Jev." }));
  return { pane: el("div", { className: "pane" }, el("h3", { textContent: title }), output), output };
}

// ---------- Titanic demos ----------

const SURVIVED = {
  type: "noul",
  instructions: "This is a passenger aboard the RMS Titanic in April 1912. Did this passenger survive the sinking?",
  criteria: { true: "The passenger survived", false: "The passenger died" },
};

const TICKET_CLASS = {
  type: "choice",
  instructions: "This is a passenger aboard the RMS Titanic in April 1912. Which ticket class did they travel in?",
  criteria: {
    first: "First class: the most expensive cabins, usually £25 or more",
    second: "Second class: mid-priced tickets, usually £10 to £30",
    third: "Third class (steerage): the cheapest tickets, usually under £10 per person; one fare can cover a whole family",
  },
};

function passengerState(passenger, { withClass }) {
  const state = {
    sex: passenger.sex,
    age: passenger.age,
    siblingsOrSpousesAboard: passenger.siblingsOrSpouses,
    parentsOrChildrenAboard: passenger.parentsOrChildren,
    farePaidInPounds: passenger.fare,
    boardedAt: passenger.embarked,
  };
  return withClass ? { ticketClass: passenger.ticketClass, ...state } : state;
}

function passengerLabel(p) {
  return `#${p.id} · ${p.sex}, ${p.age} · £${p.fare.toFixed(2)} · ${p.embarked}`;
}

function titanicDemo(root, passengers, { questions, withClass, truths }) {
  const select = el("select", {}, ...passengers.map((p, i) => el("option", { value: i, textContent: passengerLabel(p) })));
  const request = el("pre", { className: "code" });
  const button = el("button", { className: "btn", textContent: "Ask Jev" });
  const { pane, output } = resultPane();
  const body = () => ({ state: passengerState(passengers[select.value], { withClass }), questions });
  const refresh = () => { request.textContent = JSON.stringify(body(), null, 2); };
  select.addEventListener("change", refresh);
  refresh();

  runner(button, output, async () => {
    const passenger = passengers[select.value];
    const result = await post("/api/decide", body());
    return [
      ...Object.entries(result.answers).map(([name, answer]) => renderAnswer(name, answer, truths[name]?.(passenger))),
      renderMeta(result),
    ];
  });

  root.append(
    el("div", { className: "pane" },
      el("h3", { textContent: "What we send — no training, no encoding" }),
      el("label", { textContent: "Passenger" }), select,
      el("label", { textContent: "The whole request" }), request, button),
    pane);
}

function renderTitanicTable(passengers) {
  const head = ["#", "Sex", "Age", "Siblings / spouse", "Parents / children", "Fare (£)", "Boarded at", "Class", "Survived?"];
  $("#titanic-table").replaceChildren(
    el("tr", {}, ...head.map((text) => el("th", { textContent: text }))),
    ...passengers.map((p) => el("tr", {},
      ...[p.id, p.sex, p.age, p.siblingsOrSpouses, p.parentsOrChildren, p.fare.toFixed(2), p.embarked, p.ticketClass]
        .map((value) => el("td", { textContent: value })),
      el("td", { className: p.survived ? "yes" : "no", textContent: p.survived ? "yes" : "no" }))));
}

// ---------- Text demos ----------

const MESSAGES = {
  "Double charge": "Hi, I was charged twice for my subscription this month and I need one of those payments returned today — my rent is due tomorrow.",
  "Cannot log in": "I reset my password three times and I still can't get into my account. I have a client demo in an hour!",
  "Thinking of upgrading": "Love the product. Does the team plan include single sign-on, and is there a discount for universities?",
};

function messagePicker(textarea) {
  const chips = Object.entries(MESSAGES).map(([label, text]) => {
    const chip = el("button", { className: "chip", textContent: label });
    chip.addEventListener("click", () => {
      textarea.value = text;
      textarea.dispatchEvent(new Event("input"));
    });
    return chip;
  });
  return el("div", { className: "chips" }, ...chips);
}

function triageDemo(root) {
  const textarea = el("textarea", { rows: 6, value: MESSAGES["Double charge"] });
  const button = el("button", { className: "btn", textContent: "Ask Jev" });
  const { pane, output } = resultPane("Three typed answers, one call");

  runner(button, output, async () => {
    const { typed, raw } = await post("/api/triage", { message: textarea.value });
    return [
      el("div", { className: "typed", textContent: `TriageDecision { Department = ${typed.department}, Urgency = ${typed.urgency.toFixed(2)}, WantsRefund = ${typed.wantsRefund.toFixed(2)} }` }),
      ...Object.entries(raw.answers).map(([name, answer]) => renderAnswer(name, answer)),
      renderMeta(raw),
    ];
  });

  root.append(
    el("div", { className: "pane" },
      el("h3", { textContent: "A customer message — type anything" }),
      messagePicker(textarea), textarea,
      el("p", { className: "small muted", style: "margin-top:18px", textContent: "No labelled examples. No feature engineering. XGBoost cannot even read this." }),
      el("p", { className: "small", textContent: "We ask: which department? how urgent? do they want a refund?" }),
      button),
    pane);
}

const DEPARTMENT = {
  type: "choice",
  instructions: "Which team should handle this customer message?",
  criteria: {
    billing: "Charges, invoices, refunds and payment problems",
    technical_support: "Something is broken, slow, or not working as documented",
    sales: "Pricing questions, upgrades, or wanting to buy",
    account: "Login, password, profile and account access",
  },
};

function raceDemo(root, config) {
  const textarea = el("textarea", { rows: 5, value: MESSAGES["Cannot log in"] });
  const button = el("button", { className: "btn", textContent: "Race them" });
  const { pane, output } = resultPane("Same question, two models");

  runner(button, output, async () => {
    const { jev, llm } = await post("/api/race", { state: { customerMessage: textarea.value }, questions: { department: DEPARTMENT } });
    const jevWins = jev.latencyMs <= llm.latencyMs;
    const lane = (result, answer, wins) => el("div", { className: `lane${wins ? " win" : ""}` },
      el("div", { className: "who", textContent: result.model }),
      el("div", { className: "ms", textContent: `${Math.round(result.latencyMs)} ms` }),
      el("div", { className: "small", textContent: money(result.usage?.cost) }),
      el("div", { className: "out", textContent: answer }));

    const speed = llm.latencyMs / jev.latencyMs;
    const lines = [`Jev was ${speed >= 1 ? `${speed.toFixed(1)}× faster` : `${(1 / speed).toFixed(1)}× slower`}`];
    if (jev.usage?.cost > 0 && llm.usage?.cost > 0) lines.push(`${(llm.usage.cost / jev.usage.cost).toFixed(0)}× cheaper`);

    return [
      el("div", { className: "race" },
        lane(jev, `→ ${jev.answers.department.choice}  (${percent(jev.answers.department.confidence ?? Math.max(...Object.values(jev.answers.department.probabilities ?? { x: 1 })))})`, jevWins),
        lane(llm, llm.text ?? "(no text returned)", !jevWins)),
      el("div", { className: "race-summary" }, ...lines.flatMap((line, i) => [i ? " · " : "", el("strong", { textContent: line })])),
      el("p", { className: "small muted", textContent: "Timed on this laptop, over this network, right now. The LLM has to write its answer out; we then still have to parse it." }),
      el("div", { className: "meta" },
        el("span", { className: `pill ${jev.cached || llm.cached ? "cached" : "live"}`, textContent: jev.cached || llm.cached ? "REPLAY (offline)" : "LIVE" })),
    ];
  });

  root.append(
    el("div", { className: "pane" },
      el("h3", { textContent: "The question" }),
      messagePicker(textarea), textarea,
      el("p", { className: "small", style: "margin-top:18px", textContent: "Which team should handle this? billing · technical support · sales · account" }),
      el("p", { className: "small muted", textContent: `Jev: ${config.jev.model}  ·  LLM: ${config.jev.compareModel ?? "not configured"}` }),
      button),
    pane);
}

function playgroundDemo(root) {
  const state = el("textarea", { rows: 4, value: "It's raining, I have a 9am lecture across campus, and my bike has a flat tyre." });
  const question = el("input", { type: "text", value: "How should this student get to class?" });
  const options = el("textarea", { rows: 5, value: "walk: go on foot with an umbrella\nbus: take public transport\nfix_bike: repair the tyre first, then cycle\nskip: stay home and watch the recording" });
  const button = el("button", { className: "btn", textContent: "Ask Jev" });
  const { pane, output } = resultPane();

  runner(button, output, async () => {
    const criteria = Object.fromEntries(options.value.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
      const split = line.indexOf(":");
      return split < 0 ? [line, line] : [line.slice(0, split).trim(), line.slice(split + 1).trim()];
    }));
    if (Object.keys(criteria).length < 2) throw new Error("Give Jev at least two options to choose from, one per line.");
    const result = await post("/api/decide", {
      state: state.value,
      questions: { decision: { type: "choice", instructions: question.value, criteria } },
    });
    return [...Object.entries(result.answers).map(([name, answer]) => renderAnswer(name, answer)), renderMeta(result)];
  });

  root.append(
    el("div", { className: "pane" },
      el("h3", { textContent: "Any situation, any options" }),
      el("label", { textContent: "The situation (state)" }), state,
      el("label", { textContent: "The question" }), question,
      el("label", { textContent: "The allowed answers — name: description, one per line" }), options,
      button),
    pane);
}

// ---------- Boot ----------

async function boot() {
  fit();
  show(Number(location.hash.slice(1)) - 1 || 0);
  $$("pre.code[data-lang]").forEach(highlight);

  const [config, passengers] = await Promise.all([
    fetch("/api/config").then((r) => r.json()),
    fetch("data/titanic.json").then((r) => r.json()),
  ]);
  renderTalk(config);
  renderTitanicTable(passengers);

  const survivedTruth = { survived: (p) => p.survived };
  const classTruth = { ticketClass: (p) => p.ticketClass };
  titanicDemo($('[data-demo="binary"]'), passengers, { questions: { survived: SURVIVED }, withClass: true, truths: survivedTruth });
  titanicDemo($('[data-demo="multiclass"]'), passengers, { questions: { ticketClass: TICKET_CLASS }, withClass: false, truths: classTruth });
  titanicDemo($('[data-demo="multioutput"]'), passengers, { questions: { survived: SURVIVED, ticketClass: TICKET_CLASS }, withClass: false, truths: { ...survivedTruth, ...classTruth } });
  triageDemo($('[data-demo="triage"]'));
  raceDemo($('[data-demo="race"]'), config);
  playgroundDemo($('[data-demo="playground"]'));
}

boot().catch((error) => {
  $("#status").textContent = "✗ backend unreachable";
  console.error(error);
});
