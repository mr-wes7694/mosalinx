const adminAuth = require('../config/firebaseAdmin');

// Verify the Firebase ID token supplied with protected API requests.
const verifyFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Reject requests that do not include a valid Bearer token.
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const idToken = authHeader.substring(7);

    // Verify the token and attach the authenticated Firebase user to the request.
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        req.user = decodedToken;
        return next();
    } catch {
        return res.status(401).json({ message: 'Unauthorized' });
    }
};

module.exports = verifyFirebaseToken;
