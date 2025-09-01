import { ref, push, onValue, off, set, getDatabase, onDisconnect } from 'firebase/database';
import { app, auth } from '../firebase/firebase';

const db = getDatabase(app);

// Get current user ID
const getCurrentUserId = () => {
  return auth.currentUser?.uid || 'anonymous';
};

export const sendMessage = async (sessionId: string, message: any) => {
  try {
    const messagesRef = ref(db, `sessions/${sessionId}/messages`);
    const newMessageRef = push(messagesRef);
    
    // Create a clean message object without the fileData field
    const messageToSend = { ...message };
    delete messageToSend.fileData; // Remove the Blob before sending to Firebase
    
    await set(newMessageRef, {
      ...messageToSend,
      timestamp: Date.now()
    });
    return newMessageRef.key;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const subscribeToMessages = (sessionId: string, callback: (messages: any[]) => void) => {
  const messagesRef = ref(db, `sessions/${sessionId}/messages`);
  
  const handleData = (snapshot: any) => {
    const messages: any[] = [];
    snapshot.forEach((childSnapshot: any) => {
      const messageData = childSnapshot.val();
      // Ensure the timestamp is a Date object
      const timestamp = messageData.timestamp ? new Date(messageData.timestamp) : new Date();
      
      messages.push({
        id: childSnapshot.key,
        ...messageData,
        timestamp: timestamp
      });
    });
    callback(messages);
  };

  onValue(messagesRef, handleData);
  
  // Return unsubscribe function
  return () => {
    off(messagesRef, 'value', handleData);
  };
};

// Create or update session with expiration
export const createOrUpdateSession = async (sessionId: string) => {
  try {
    const sessionRef = ref(db, `sessions/${sessionId}`);
    const now = Date.now();
    const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours from now
    
    await set(sessionRef, {
      createdAt: now,
      expiresAt: expiresAt,
      lastActive: now
    });
    
    return { sessionId, expiresAt };
  } catch (error) {
    console.error('Error creating/updating session:', error);
    throw error;
  }
};

export const joinSession = async (sessionId: string, userId: string, username: string) => {
  try {
    // First create/update the session
    await createOrUpdateSession(sessionId);
    
    // Reference to user's status in the session
    const userStatusRef = ref(db, `sessions/${sessionId}/users/${userId}`);
    const userPresenceRef = ref(db, `sessions/${sessionId}/participants/${userId}`);
    const connectedRef = ref(db, '.info/connected');
    
    // Set initial user data
    const userData = {
      userId,
      username,
      status: 'online',
      joinedAt: Date.now(),
      lastActive: Date.now(),
      isActive: true
    };
    
    // Update user data in the database
    await set(userStatusRef, userData);
    
    // Set up presence detection
    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // User's connection is online
        const userStatusUpdate = {
          ...userData,
          status: 'online',
          lastActive: Date.now(),
          isOnline: true
        };
        
        // Update user status to online
        set(userStatusRef, userStatusUpdate);
        set(userPresenceRef, { 
          isOnline: true, 
          lastActive: Date.now(),
          username: username
        });
        
        // Set up disconnect handler
        onDisconnect(userStatusRef).update({
          status: 'offline',
          lastActive: Date.now(),
          isActive: false
        });
        
        onDisconnect(userPresenceRef).remove();
      }
    });
    
    // Return cleanup function
    return () => {
      // Update status to offline when leaving the session
      set(userStatusRef, {
        ...userData,
        status: 'offline',
        lastActive: Date.now(),
        isActive: false
      });
      set(userPresenceRef, { 
        isOnline: false, 
        lastActive: Date.now()
      });
      
      // Unsubscribe from the connection listener
      off(connectedRef, 'value');
    };
  } catch (error) {
    console.error('Error joining session:', error);
    throw error;
  }
};
