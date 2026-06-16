import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

// Firebase project: t-gaia-world-cup-f039c (RTDB region: europe-west1).
// Realtime DB rules are intentionally open (read/write: true): only ~20 known
// colleagues access this for a single event, so no auth layer is needed.
// These values are not secrets — Firebase web config is public by design.
const firebaseConfig = {
  apiKey: 'AIzaSyB6HS7KQCxeukLc3cQ7lnl2fVOfTgiQc0s',
  authDomain: 't-gaia-world-cup-f039c.firebaseapp.com',
  databaseURL:
    'https://t-gaia-world-cup-f039c-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 't-gaia-world-cup-f039c',
  storageBucket: 't-gaia-world-cup-f039c.firebasestorage.app',
  messagingSenderId: '148953403316',
  appId: '1:148953403316:web:fa27ff04bea8999990ece1',
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
