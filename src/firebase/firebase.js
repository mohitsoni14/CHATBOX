// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, set, onValue, onDisconnect } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// Your web app's Firebase configuration
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

// Initialize Firebase with retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
auth.useDeviceLanguage();

export const database = getDatabase(app);

// Sign in anonymously with retry logic
let isAuthenticated = false;
let authRetryCount = 0;

const initAuth = async (retryCount = 0) => {
  try {
    console.log(`[${new Date().toISOString()}] Attempting anonymous auth (attempt ${retryCount + 1})...`);
    const userCredential = await signInAnonymously(auth);
    
    isAuthenticated = true;
    authRetryCount = 0;
    
    console.log('✅ Authenticated successfully:', {
      uid: userCredential.user.uid,
      isAnonymous: userCredential.user.isAnonymous
    });
    
    // Setup presence system
    const userStatusRef = ref(database, 'status/' + userCredential.user.uid);
    const userStatusDatabaseRef = ref(database, 'status/' + userCredential.user.uid);
    
    // Set user as online
    await set(userStatusRef, {
      state: 'online',
      last_changed: new Date().toISOString(),
    });
    
    // Create a reference to the special '.info/connected' path in Realtime Database.
    const connectedRef = ref(database, '.info/connected');
    onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        // When we disconnect, update the database
        onDisconnect(userStatusRef).set({
          state: 'offline',
          last_changed: new Date().toISOString(),
        }).catch((error) => {
          console.error('Error setting up onDisconnect:', error);
        });
      }
    });
    
    return userCredential.user;
  } catch (error) {
    console.error(`❌ Authentication error (attempt ${retryCount + 1}):`, {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    if (retryCount < MAX_RETRIES - 1) {
      console.log(`Retrying in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return initAuth(retryCount + 1);
    }
    
    throw error;
  }
};

// Initialize authentication with error boundary
const initializeFirebase = async () => {
  try {
    await initAuth();
    // Set up auth state change listener
    onAuthStateChanged(auth, (user) => {
      if (user) {
        isAuthenticated = true;
        console.log('👤 Auth state: User is signed in', { uid: user.uid });
      } else {
        isAuthenticated = false;
        console.log('👤 Auth state: User is signed out');
        // Try to re-authenticate if user gets signed out
        initAuth().catch(console.error);
      }
    }, (error) => {
      console.error('Auth state error:', error);
      isAuthenticated = false;
    });
  } catch (error) {
    console.error('🔥 Failed to initialize Firebase after multiple attempts:', error);
  }
};

// Start the initialization
initializeFirebase();

// Function to save session data with retry logic
export const saveSessionData = async (sessionId, username, retryCount = 0) => {
  console.log(`[${new Date().toISOString()}] saveSessionData called:`, { 
    sessionId, 
    username,
    attempt: retryCount + 1
  });
  
  try {
    if (!auth.currentUser) {
      console.log('No current user, initializing auth...');
      await initAuth();
      if (!auth.currentUser) {
        throw new Error('Failed to initialize authentication');
      }
    }
    
    const userId = auth.currentUser.uid;
    const sessionRef = ref(database, `sessions/${sessionId}/users/${userId}`);
    
    const userData = {
      id: userId,
      username: username || `User${Math.floor(1000 + Math.random() * 9000)}`,
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      isOnline: true
    };
    
    console.log('Saving user data:', userData);
    await set(sessionRef, userData);
    
    // Set up presence
    const userStatusRef = ref(database, `sessions/${sessionId}/users/${userId}/isOnline`);
    const connectedRef = ref(database, '.info/connected');
    
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        set(userStatusRef, true);
        onDisconnect(userStatusRef).set(false);
      }
    });
    
    // Update user data with session information
    await set(sessionRef, {
      ...userData,
      currentSession: sessionId
    });

    return userData;
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
function getSessionUsers(sessionId) {
  const usersRef = ref(database, `sessions/${sessionId}/users`);
  return usersRef;
}