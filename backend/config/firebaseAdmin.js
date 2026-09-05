const {
    initializeApp,
    getApps,
    applicationDefault,
} = require('firebase-admin/app');

const { getAuth } = require('firebase-admin/auth');

const config = require('./config');

// Verify that the required Firebase project configuration is available.
if (!config.firebase.projectId) {
    throw new Error('Missing Firebase project configuration');
}

// Initialize Firebase Admin once using the service account configured
// through GOOGLE_APPLICATION_CREDENTIALS.
const firebaseApp = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: applicationDefault(),
        projectId: config.firebase.projectId,
    });

// Create Firebase Authentication for backend token verification.
const adminAuth = getAuth(firebaseApp);

module.exports = {
    adminAuth,
};