const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const config = require('./config');

// Verify that all required Firebase Admin credentials are available.
if (
    !config.firebase.projectId ||
    !config.firebase.clientEmail ||
    !config.firebase.privateKey
) {
    throw new Error('Missing Firebase Admin configuration');
}

// Initialize Firebase Admin once using the configured service account.
const firebaseApp = getApps().length
    ? getApps()[0]
    : initializeApp({
          credential: cert({
              projectId: config.firebase.projectId,
              clientEmail: config.firebase.clientEmail,
              privateKey: config.firebase.privateKey,
          }),
      });

// Create the Firebase Admin authentication service for backend token verification.
const adminAuth = getAuth(firebaseApp);

module.exports = adminAuth;
