const express = require('express');
const multer = require('multer');

const {
    uploadResource,
    getResourcesByProject,
    getResourceById,
    downloadResource,
} = require('../controllers/resourceController');

const { verifyFirebaseToken } = require('../middleware');

const router = express.Router();

// Store uploaded files in memory before sending them to Firebase Storage.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB maximum file size
    },
});

// Upload a new resource.
router.post(
    '/upload',
    verifyFirebaseToken,
    upload.single('file'),
    uploadResource
);

// Download a resource.
// Firebase authentication is required.
router.get(
    '/:resourceId/download',
    verifyFirebaseToken,
    downloadResource
);

// Get all resources belonging to a project.
router.get('/project/:projectId', getResourcesByProject);

// Get one resource by its ID.
router.get('/:resourceId', getResourceById);

module.exports = router;