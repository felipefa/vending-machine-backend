import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
const firebaseOptions = JSON.parse(process.env.FIREBASE_OPTIONS || '');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
export const firebaseApp = initializeApp(firebaseOptions);
export const firebaseAuth = initializeAuth(firebaseApp);
export const firebaseAdmin = admin;
export const firestore = firebaseAdmin.firestore();
