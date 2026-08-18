// הגדרות הפרויקט שלך ב-Firebase (Project settings > General > Your apps > SDK setup and configuration).
// האתר סטטי לגמרי - הערכים האלה נועדו להיות ציבוריים בצד הלקוח,
// ההגנה האמיתית על הנתונים היא ב-firestore.rules.
export const firebaseConfig = {
  apiKey: "AIzaSyCQvsNfeqk78NYWrna-vdFc9Q0a3LiRwkk",
  authDomain: "oncetext-73040.firebaseapp.com",
  projectId: "oncetext-73040",
  storageBucket: "oncetext-73040.firebasestorage.app",
  messagingSenderId: "988547148900",
  appId: "1:988547148900:web:a1b2cad05e858feb540371"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

export const app = initializeApp(firebaseConfig);
