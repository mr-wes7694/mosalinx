const express = require('express');
const multer = require('multer');

const {
    uploadResource,
    getResourcesByProject,
    searchResources,
    getResourceById,
    downloadResource,
} = require('../controllers/resourceController');

const { verifyFirebaseToken } = require('../middleware');

const router = express.Router();

// Store uploaded files in memory before uploading them to Firebase Storage.
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

// Search resources belonging to a project.
router.get(
    '/project/:projectId/search',
    verifyFirebaseToken,
    searchResources
);

// Get all resources belonging to a project.
router.get(
    '/project/:projectId',
    verifyFirebaseToken,
    getResourcesByProject
);

// Download a resource.
// Firebase authentication is required for downloads.
router.get(
    '/:resourceId/download',
    verifyFirebaseToken,
    downloadResource
);

// Get one resource by its ID.
router.get(
    '/:resourceId',
    verifyFirebaseToken,
    getResourceById
);
module.exports = router;
