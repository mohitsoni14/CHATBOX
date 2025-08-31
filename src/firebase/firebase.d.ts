import { FirebaseApp } from 'firebase/app';
import { Auth, User } from 'firebase/auth';
import { Database, DataSnapshot } from 'firebase/database';

// Export the Firebase app instance
declare const app: FirebaseApp;

// Export auth instance
declare const auth: Auth;

// Export database instance
declare const database: Database;

// Function to save session data with retry logic
declare function saveSessionData(sessionId: string, username: string, retryCount?: number): Promise<void>;

// Function to get users in a session
declare function getSessionUsers(sessionId: string): Promise<DataSnapshot>;

// Export all the declarations
export {
  app,
  auth,
  database,
  saveSessionData,
  getSessionUsers
};
