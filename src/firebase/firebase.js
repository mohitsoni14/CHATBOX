// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, set, onValue } from "firebase/database";
import { getAuth, signInAnonymously } from 'firebase/auth';

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
const auth = getAuth(app);

// Sign in anonymously
let isAuthenticated = false;
const initAuth = async () => {
  try {
    console.log('Starting anonymous auth...');
    const userCredential = await signInAnonymously(auth);
    isAuthenticated = true;
    console.log('Authenticated successfully:', {
      uid: userCredential.user.uid,
      isAnonymous: userCredential.user.isAnonymous
    });
    return userCredential.user;
  } catch (error) {
    console.error('Authentication error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Initialize authentication
initAuth();

// Function to save session data
export const saveSessionData = async (sessionId, username) => {
  console.log('saveSessionData called with:', { sessionId, username });
  
  try {
    if (!isAuthenticated || !auth.currentUser) {
      console.log('No active user, initializing auth...');
      await initAuth();
    }
    
    if (!auth.currentUser) {
      const error = new Error('User not authenticated after initialization');
      console.error(error);
      throw error;
    }

    const userPath = `sessions/${sessionId}/users/${auth.currentUser.uid}`;
    console.log('Attempting to write to path:', userPath);
    
    const userData = {
      username: username,
      sessionId: sessionId,
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      userId: auth.currentUser.uid
    };
    
    console.log('Writing user data:', userData);
    
    const result = await set(ref(database, userPath), userData);
    console.log('Write successful');
    return result;
  } catch (error) {
    console.error('Error in saveSessionData:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Function to get users in a session
export const getSessionUsers = (sessionId) => {
  return ref(database, `sessions/${sessionId}/users`);
};

export { auth, database };