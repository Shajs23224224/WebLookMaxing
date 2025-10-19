import admin from 'firebase-admin';
import { logger } from '../utils/logger';

let firebaseApp: admin.app.App;

export const initializeFirebase = async (): Promise<void> => {
  try {
    if (admin.apps.length > 0) {
      firebaseApp = admin.app();
      return;
    }

    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID || 'your-project-id',
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || 'key-id',
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n') || '-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----',
      client_email: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com',
      client_id: process.env.FIREBASE_CLIENT_ID || 'your-client-id',
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });

    logger.info('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('Error initializing Firebase:', error);
    throw error;
  }
};

export const getFirestore = (): admin.firestore.Firestore => {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized');
  }
  return firebaseApp.firestore();
};

export const getStorage = (): admin.storage.Storage => {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized');
  }
  return firebaseApp.storage();
};

export { firebaseApp };
