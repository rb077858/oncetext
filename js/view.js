import { app, firebaseConfig } from "./firebase-config.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const db = getFirestore(app);

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const viewBox = document.getElementById("view-box");

function showMessage(msg) {
  viewBox.innerHTML = "";
  const p = document.createElement("p");
  p.className = "view-msg";
  p.textContent = msg;
  viewBox.appendChild(p);
}

function seenKey(noteId) {
  return `oncetext_seen_${noteId}`;
}

// שולח בקשת REST ישירה ל-Firestore עם keepalive, כדי שהבקשה תושלם
// גם אם הטאב נסגר ממש ברגע המעבר ל-hidden (וה-SDK הרגיל לא היה מספיק).
function consumeOneView(noteId) {
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents:commit`;
  const body = JSON.stringify({
    writes: [
      {
        transform: {
          document: `projects/${firebaseConfig.projectId}/databases/(default)/documents/notes/${noteId}`,
          fieldTransforms: [
            { fieldPath: "consumedCount", increment: { integerValue: "1" } },
          ],
        },
      },
    ],
  });
  fetch(url, {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body,
  }).catch(() => {});
}

function watchForLeave(noteId) {
  let consumed = false;
  let left = false;

  function consume() {
    if (consumed) return;
    consumed = true;
    consumeOneView(noteId);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      left = true;
      consume();
    } else if (document.visibilityState === "visible" && left) {
      // חזר למסך הזה אחרי שכבר "עזב" - ההודעה כבר נצרכה, אז היא נעלמת גם כאן
      showMessage("צפית בהודעה זו וכעת היא נעלמה.");
    }
  });

  window.addEventListener("pagehide", consume);
}

function wrapLines(ctx, text, maxWidth) {
  const lines = [];
  for (const rawLine of text.split("\n")) {
    if (rawLine === "") {
      lines.push("");
      continue;
    }
    const words = rawLine.split(" ");
    let current = "";
    for (const word of words) {
      const candidate = current ? current + " " + word : word;
      if (ctx.measureText(candidate).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function renderText(text) {
  viewBox.innerHTML = "";
  const canvas = document.createElement("canvas");
  viewBox.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = Math.min(500, Math.max(260, viewBox.clientWidth - 32));
  const fontSize = 17;
  const lineHeight = fontSize * 1.5;
  const padding = 16;

  ctx.font = `${fontSize}px -apple-system, "Segoe UI", Arial, sans-serif`;
  const lines = wrapLines(ctx, text, cssWidth - padding * 2);

  const cssHeight = Math.max(60, lines.length * lineHeight + padding * 2);

  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  canvas.style.width = cssWidth + "px";
  canvas.style.height = cssHeight + "px";

  ctx.scale(dpr, dpr);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  ctx.font = `${fontSize}px -apple-system, "Segoe UI", Arial, sans-serif`;
  ctx.fillStyle = "#1a1a1a";
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";

  lines.forEach((line, i) => {
    ctx.fillText(line, cssWidth - padding, padding + i * lineHeight, cssWidth - padding * 2);
  });
}

function blockCopyAttempts() {
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("dragstart", (e) => e.preventDefault());
  document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && ["s", "p", "u", "c", "a"].includes(k)) {
      e.preventDefault();
    }
  });
}

async function main() {
  blockCopyAttempts();

  if (!id) {
    showMessage("קישור לא תקין.");
    return;
  }

  const key = seenKey(id);
  if (localStorage.getItem(key)) {
    showMessage("כבר צפית בהודעה הזו. היא נעלמה.");
    return;
  }

  let snap;
  try {
    snap = await getDoc(doc(db, "notes", id));
  } catch (err) {
    showMessage("ההודעה כבר לא זמינה.");
    return;
  }

  if (!snap.exists()) {
    showMessage("ההודעה לא נמצאה - כנראה כבר נצפתה על ידי כל מי שיכול היה לצפות בה, או שהקישור שגוי.");
    return;
  }

  const data = snap.data();

  // חוסם צפייה חוזרת מאותו דפדפן, גם אם עדיין נשארו "מקומות" פנויים להודעה הזו
  localStorage.setItem(key, "1");

  renderText(data.text);
  watchForLeave(id);
}

main();
