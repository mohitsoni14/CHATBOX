import Pusher from 'pusher-js';

declare global {
  interface Window {
    ENV: {
      VITE_PUSHER_APP_KEY: string;
      VITE_PUSHER_CLUSTER: string;
    };
  }
}

const PUSHER_APP_KEY = import.meta.env.VITE_PUSHER_APP_KEY || window.ENV?.VITE_PUSHER_APP_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || window.ENV?.VITE_PUSHER_CLUSTER || 'mt1';

if (!PUSHER_APP_KEY) {
  throw new Error('Missing VITE_PUSHER_APP_KEY environment variable');
}

// Enable pusher logging - don't include this in production
Pusher.logToConsole = process.env.NODE_ENV === 'development';

export const pusherClient = new Pusher(PUSHER_APP_KEY, {
  cluster: PUSHER_CLUSTER,
  forceTLS: true,
  authEndpoint: '/api/pusher/auth',
  auth: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

export const subscribeToChannel = (channelName: string, eventName: string, callback: (data: any) => void) => {
  const channel = pusherClient.subscribe(channelName);
  
  channel.bind('pusher:subscription_succeeded', () => {
    console.log(`Successfully subscribed to ${channelName}`);
  });
  
  channel.bind('pusher:subscription_error', (error: any) => {
    console.error(`Error subscribing to ${channelName}:`, error);
  });
  
  channel.bind(eventName, callback);
  
  return () => {
    channel.unbind(eventName, callback);
    pusherClient.unsubscribe(channelName);
  };
};

export const sendSignal = (channelName: string, eventName: string, data: any) => {
  return fetch('/api/pusher/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: channelName,
      event: eventName,
      data: data,
    }),
  });
};
