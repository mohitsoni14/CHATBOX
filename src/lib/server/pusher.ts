import Pusher from 'pusher';

// This file is for server-side use only
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.VITE_PUSHER_APP_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.VITE_PUSHER_CLUSTER || 'mt1',
  useTLS: true,
});

export default pusher;
