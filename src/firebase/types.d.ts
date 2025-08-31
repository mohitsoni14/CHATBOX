import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Database } from 'firebase/database';

declare module '../firebase/firebase' {
  export const app: FirebaseApp;
  export const auth: Auth;
  export const database: Database;
  export const saveSessionData: (userId: string, data: any) => Promise<void>;
}
