import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.database();

/**
 * Scheduled function to clean up data older than 24 hours
 * Runs every 6 hours
 */
export const cleanupOldData = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async (context: functions.EventContext) => {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000); // 24 hours in milliseconds
    
    try {
      console.log('Starting cleanup of old data...');
      
      // Clean up old sessions
      const sessionsRef = db.ref('sessions');
      const sessionsSnapshot = await sessionsRef.once('value');
      const sessions = sessionsSnapshot.val() || {};
      
      const updates: { [key: string]: null } = {};
      let sessionsCleaned = 0;
      
      // Find sessions older than 24 hours
      Object.entries(sessions).forEach(([sessionId, sessionData]: [string, any]) => {
        const lastActive = (sessionData as any).lastActive || (sessionData as any).createdAt || 0;
        if (lastActive < oneDayAgo) {
          updates[`sessions/${sessionId}`] = null;
          sessionsCleaned++;
        } else if ((sessionData as any).messages) {
          // Clean up old messages within active sessions
          const messages = (sessionData as any).messages;
          Object.entries(messages).forEach(([messageId, message]: [string, unknown]) => {
            const messageTime = (message as any).timestamp || 0;
            if (messageTime < oneDayAgo) {
              updates[`sessions/${sessionId}/messages/${messageId}`] = null;
            }
          });
        }
      });
      
      // Perform all deletions in a single update
      if (Object.keys(updates).length > 0) {
        await db.ref().update(updates);
        console.log(`Cleanup complete. Removed ${sessionsCleaned} old sessions and their messages.`);
      } else {
        console.log('No old data found to clean up.');
      }
      
      return null;
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  });
