import { app } from "./firebase-config.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const db = getFirestore(app);

const ID_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const ID_LENGTH = 16;
const EXPIRES_AFTER_MS = 30 * 24 * 60 * 60 * 1000; // 30 יום - חלון לניקוי אוטומטי (TTL) של הודעות שאף אחד לא פתח

function generateId() {
  const bytes = new Uint8Array(ID_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ID_CHARS[b % ID_CHARS.length]).join("");
}

function buildViewUrl(id) {
  const base = new URL("view.html", window.location.href);
  base.searchParams.set("id", id);
  return base.toString();
}

const form = document.getElementById("create-form");
const textEl = document.getElementById("text");
const maxViewsEl = document.getElementById("max-views");
const resultEl = document.getElementById("result");
const linkEl = document.getElementById("link");
const copyBtn = document.getElementById("copy-btn");
const whatsappBtn = document.getElementById("whatsapp-btn");
const newBtn = document.getElementById("new-btn");
const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = textEl.value.trim();
  if (!text) return;

  let maxViews = parseInt(maxViewsEl.value, 10);
  if (!Number.isFinite(maxViews) || maxViews < 1) {
    maxViews = 1;
  }
  maxViewsEl.value = maxViews;

  submitBtn.disabled = true;
  submitBtn.textContent = "יוצר קישור...";

  try {
    const id = generateId();
    await setDoc(doc(db, "notes", id), {
      text,
      maxViews,
      consumedCount: 0,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + EXPIRES_AFTER_MS),
    });

    const url = buildViewUrl(id);
    linkEl.value = url;
    whatsappBtn.href = "https://wa.me/?text=" + encodeURIComponent(url);
    resultEl.classList.add("show");

    // מנקים את הטופס כדי שלא יישאר עותק של הטקסט על המסך אחרי היצירה
    textEl.value = "";
    maxViewsEl.value = 1;
  } catch (err) {
    console.error(err);
    alert("משהו השתבש ביצירת הקישור. ודא שהגדרות Firebase נכונות ונסה שוב.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "צור קישור";
  }
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(linkEl.value);
    const original = copyBtn.textContent;
    copyBtn.textContent = "הועתק!";
    setTimeout(() => (copyBtn.textContent = original), 1500);
  } catch {
    linkEl.select();
    document.execCommand("copy");
  }
});

newBtn.addEventListener("click", () => {
  resultEl.classList.remove("show");
  textEl.focus();
});
