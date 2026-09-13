const {
    initializeApp,
    cert,
    getApps,
} = require('firebase-admin/app');

const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');

const config = require('./config');

// Check that the Firebase Admin configuration is available.
if (
    !config.firebase.projectId ||
    !config.firebase.clientEmail ||
    !config.firebase.privateKey ||
    !config.firebase.storageBucket
) {
    throw new Error('Missing Firebase Admin or Storage configuration');
}

// Initialize Firebase Admin once using the existing backend credentials.
const firebaseApp = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({
            projectId: config.firebase.projectId,
            clientEmail: config.firebase.clientEmail,
            privateKey: config.firebase.privateKey,
        }),
        projectId: config.firebase.projectId,
        storageBucket: config.firebase.storageBucket,
    });

// Create Firebase Authentication for backend token verification.
const adminAuth = getAuth(firebaseApp);

// Create the Firebase Storage bucket using the same Admin app.
const storageBucket = getStorage(firebaseApp).bucket();

module.exports = {
    adminAuth,
    storageBucket,
};
