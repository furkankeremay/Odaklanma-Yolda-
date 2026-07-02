import { getApps, initializeApp, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

const apps = getApps();
const adminApp = apps.length === 0
  ? initializeApp({ projectId })
  : getApp();

export const adminAuth = getAuth(adminApp);
export default adminApp;
