// הגדרות הפרויקט שלך ב-Firebase (Project settings > General > Your apps > SDK setup and configuration).
// האתר סטטי לגמרי - הערכים האלה נועדו להיות ציבוריים בצד הלקוח,
// ההגנה האמיתית על הנתונים היא ב-firestore.rules.
export const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

export const app = initializeApp(firebaseConfig);
