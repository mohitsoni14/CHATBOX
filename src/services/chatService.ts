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

export const joinSession = async (sessionId: string, userId: string, username: string) => {
  try {
    const userRef = ref(db, `sessions/${sessionId}/participants/${userId}`);
    await set(userRef, {
      username,
      joinedAt: Date.now(),
      isOnline: true,
      lastSeen: null
    });

    // Set up presence detection
    const userStatusRef = ref(db, `sessions/${sessionId}/participants/${userId}`);
    const connectedRef = ref(db, '.info/connected');
    
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // User's connection is online
        set(ref(db, `sessions/${sessionId}/participants/${userId}/isOnline`), true);
        
        // Set up disconnect handler
        onDisconnect(ref(db, `sessions/${sessionId}/participants/${userId}/isOnline`))
          .set(false)
          .then(() => {
            console.log('On disconnect function set up');
          });
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error joining session:', error);
    throw error;
  }
};
