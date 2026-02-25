import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyDknBwdE-nc6qxR8hJqR-eEzc5IIFLbdDA',
  authDomain: 'archpal.firebaseapp.com',
  projectId: 'archpal',
  storageBucket: 'archpal.firebasestorage.app',
  messagingSenderId: '332992484251',
  appId: '1:332992484251:web:1dae6c316c0b9a7ce5873e',
  measurementId: 'G-THP9YTX3SV',
}

export const app = initializeApp(firebaseConfig)

// Analytics only in browser (not SSR-safe but fine for client-only Vite app)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null
