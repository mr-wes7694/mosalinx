const fs = require('fs');

const {
    initializeApp,
    getApps,
    cert,
} = require('firebase-admin/app');

const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');

const config = require('./config');

// Verify that the required Firebase project configuration is available.
if (!config.firebase.projectId) {
    throw new Error('Missing Firebase project configuration');
}

if (!config.firebase.storageBucket) {
    throw new Error('Missing Firebase Storage bucket configuration');
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('Missing Firebase service account configuration');
}

// Load the existing local service account file.
let serviceAccount;

try {
    serviceAccount = JSON.parse(
        fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')
    );
} catch (error) {
    throw new Error('Unable to load Firebase service account file');
}

// Initialize Firebase Admin once using the configured service account.
const firebaseApp = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
        projectId: config.firebase.projectId,
        storageBucket: config.firebase.storageBucket,
    });

// Create Firebase Authentication for backend token verification.
const adminAuth = getAuth(firebaseApp);

// Create the Firebase Storage bucket reference.
const storageBucket = getStorage(firebaseApp).bucket();

module.exports = {
    adminAuth,
    storageBucket,
};
