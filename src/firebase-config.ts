import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

// ⚠️ PLACEHOLDER VALUES — replaced once the Firebase project is created.
// Realtime DB rules are intentionally open (read/write: true): only ~20 known
// colleagues access this for a single event, so no auth layer is needed.
const firebaseConfig = {
  apiKey: 'PLACEHOLDER',
  authDomain: 'PLACEHOLDER.firebaseapp.com',
  databaseURL:
    'https://PLACEHOLDER-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'PLACEHOLDER',
  storageBucket: 'PLACEHOLDER.appspot.com',
  messagingSenderId: 'PLACEHOLDER',
  appId: 'PLACEHOLDER',
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
