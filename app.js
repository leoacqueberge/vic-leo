// ← Modifie ici pour changer le rendez-vous
const EVENT = {
  date: "2026-06-10",
  time: "08:30",
  location: "Gare de Tours",
};

const targetLabel = document.getElementById("target-label");
const locationLabel = document.getElementById("location-label");
const countdownUnits = document.getElementById("countdown-units");
const funMessage = document.getElementById("fun-message");

const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");

function parseTarget() {
  return new Date(`${EVENT.date}T${EVENT.time}`);
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
  const target = parseTarget();
  const diffMs = target - Date.now();

  targetLabel.textContent = formatTargetDate(target);
  locationLabel.textContent = `📍 ${EVENT.location}`;

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

tick();
setInterval(tick, 1000);
