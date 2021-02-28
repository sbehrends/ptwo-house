import firebase from 'firebase/app'
import 'firebase/firestore' // If you need it
import 'firebase/analytics' // If you need it

const clientCredentials = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}

let firebaseApp
let analytics

if (firebase.apps.length) {
  firebaseApp = firebase.apps[0]
} else {
  firebaseApp = firebase.initializeApp(clientCredentials)
  if (clientCredentials.measurementId && typeof window === 'object') {
    analytics = firebase.analytics()
  }
}

export default firebaseApp
export { firebaseApp, firebase, analytics, clientCredentials }
