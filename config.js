export default {
  firebase: {
    enabled: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? true : false,
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  },
}