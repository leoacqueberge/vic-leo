const STORAGE_KEY = "vicLeoEvent";
const ROW_ID = "vic-leo";

const setupScreen = document.getElementById("setup-screen");
const countdownScreen = document.getElementById("countdown-screen");
const setupForm = document.getElementById("setup-form");
const inputDate = document.getElementById("input-date");
const inputTime = document.getElementById("input-time");
const inputLocation = document.getElementById("input-location");
const editBtn = document.getElementById("edit-btn");

const targetLabel = document.getElementById("target-label");
const locationLabel = document.getElementById("location-label");
const countdownUnits = document.getElementById("countdown-units");
const funMessage = document.getElementById("fun-message");

const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let tickInterval = null;
let currentEvent = null;
let saving = false;

function loadLocalEvent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalEvent(event) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(event));
}

async function loadRemoteEvent() {
  const { data, error } = await supabase
    .from("countdown")
    .select("date, time, location, updated_at")
    .eq("id", ROW_ID)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    date: data.date,
    time: data.time,
    location: data.location || "",
    updated_at: data.updated_at,
  };
}

async function saveRemoteEvent(event) {
  const { error } = await supabase.from("countdown").upsert(
    {
      id: ROW_ID,
      date: event.date,
      time: event.time,
      location: event.location || "",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) throw error;
}

function parseTarget(event) {
  return new Date(`${event.date}T${event.time}`);
}

function formatTargetDate(date) {
  const formatted = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeStr = minutes === 0 ? `${hours}h` : `${hours}h${String(minutes).padStart(2, "0")}`;
  return `${formatted} à ${timeStr}`;
}

function getFunMessage(diffMs) {
  if (diffMs <= 0) return "Vic + Leo, c'est maintenant !";

  const totalHours = diffMs / (1000 * 60 * 60);
  const totalDays = diffMs / (1000 * 60 * 60 * 24);

  if (totalHours < 1) return "Presque là !";
  if (totalHours < 48) return "Plus que quelques heures !";
  if (totalDays < 7) return "Ça arrive !";
  return "Encore un peu de patience…";
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function tick() {
  if (!currentEvent) return;

  const target = parseTarget(currentEvent);
  const now = new Date();
  const diffMs = target - now;

  targetLabel.textContent = formatTargetDate(target);

  if (currentEvent.location) {
    locationLabel.textContent = `📍 ${currentEvent.location}`;
    locationLabel.classList.remove("hidden");
  } else {
    locationLabel.classList.add("hidden");
  }

  if (diffMs <= 0) {
    daysEl.textContent = "0";
    hoursEl.textContent = "00";
    minutesEl.textContent = "00";
    secondsEl.textContent = "00";
    countdownUnits.classList.add("past");
    funMessage.textContent = getFunMessage(diffMs);
    funMessage.classList.add("now");
    return;
  }

  countdownUnits.classList.remove("past");
  funMessage.classList.remove("now");

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  daysEl.textContent = String(days);
  hoursEl.textContent = pad(hours);
  minutesEl.textContent = pad(minutes);
  secondsEl.textContent = pad(seconds);
  funMessage.textContent = getFunMessage(diffMs);
}

function showSetup(prefill) {
  clearInterval(tickInterval);
  tickInterval = null;
  currentEvent = null;

  setupScreen.classList.remove("hidden");
  countdownScreen.classList.add("hidden");

  if (prefill) {
    inputDate.value = prefill.date;
    inputTime.value = prefill.time;
    inputLocation.value = prefill.location || "";
  }
}

function showCountdown(event) {
  currentEvent = event;
  setupScreen.classList.add("hidden");
  countdownScreen.classList.remove("hidden");

  tick();
  if (!tickInterval) tickInterval = setInterval(tick, 1000);
}

function subscribeToChanges() {
  supabase
    .channel("countdown-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "countdown" },
      (payload) => {
        if (saving || !payload.new?.date || !payload.new?.time) return;

        const event = {
          date: payload.new.date,
          time: payload.new.time,
          location: payload.new.location || "",
        };

        saveLocalEvent(event);
        showCountdown(event);
      }
    )
    .subscribe();
}

async function init() {
  let event = null;

  try {
    event = await loadRemoteEvent();
    if (event) saveLocalEvent(event);
  } catch {
    event = loadLocalEvent();
  }

  subscribeToChanges();

  if (event?.date && event?.time) {
    showCountdown(event);
  } else {
    showSetup(event);
  }
}

setupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const event = {
    date: inputDate.value,
    time: inputTime.value,
    location: inputLocation.value.trim(),
  };

  saving = true;
  saveLocalEvent(event);
  showCountdown(event);

  try {
    await saveRemoteEvent(event);
  } catch {
    funMessage.textContent = "Sauvegardé en local (Supabase indisponible)";
  } finally {
    saving = false;
  }
});

editBtn.addEventListener("click", async () => {
  let prefill = currentEvent || loadLocalEvent();
  try {
    const remote = await loadRemoteEvent();
    if (remote) prefill = remote;
  } catch {
    /* garde le cache local */
  }
  showSetup(prefill);
});

init();
