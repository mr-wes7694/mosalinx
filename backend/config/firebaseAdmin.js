const { initializeApp, getApps, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');
const config = require('./config');

// Verify that the required Firebase configuration is available.
if (
    !config.firebase.projectId ||
    !config.firebase.storageBucket
) {
    throw new Error('Missing Firebase project or storage configuration');
}

// Initialize Firebase Admin once using the service account configured
// through GOOGLE_APPLICATION_CREDENTIALS.
const firebaseApp = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: applicationDefault(),
        projectId: config.firebase.projectId,
        storageBucket: config.firebase.storageBucket,
    });

// Create Firebase Authentication for backend token verification.
const adminAuth = getAuth(firebaseApp);

// Create the Firebase Storage bucket using the same Firebase Admin app.
const storageBucket = getStorage(firebaseApp).bucket();

module.exports = {
    adminAuth,
    storageBucket,
};