const isDev = import.meta.env.DEV;

export const API_URL = isDev ? 'http://localhost:3001' : '';

export const WS_URL = isDev
  ? 'ws://localhost:3001'
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
