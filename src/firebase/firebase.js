// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, set } from "firebase/database";
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB13M76giT4idpdkhbZZFaXVr1XSkVQgX0",
  authDomain: "masti-d4e13.firebaseapp.com",
  projectId: "masti-d4e13",
  storageBucket: "masti-d4e13.firebasestorage.app",
  messagingSenderId: "613367761798",
  appId: "1:613367761798:web:66fb862cf87f272ee2ba07",
  measurementId: "G-57JZ1MXLZB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

// Function to save session data
export const saveSessionData = (sessionId, username) => {
  const userRef = ref(database, `sessions/${sessionId}/users/${Date.now()}`);
  return set(userRef, {
    username: username,
    sessionId: sessionId,
    joinedAt: new Date().toISOString(),
    lastActive: new Date().toISOString()
  });
};

// Function to get users in a session
export const getSessionUsers = (sessionId) => {
  return ref(database, `sessions/${sessionId}/users`);
};

export const auth = getAuth(app);
export { database };