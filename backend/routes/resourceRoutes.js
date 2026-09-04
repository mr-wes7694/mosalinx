const express = require('express');
const multer = require('multer');

const {
    uploadResource,
    getResourcesByProject,
    getResourceById,
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
// Firebase authentication runs before the file upload and controller.
router.post(
    '/upload',
    verifyFirebaseToken,
    upload.single('file'),
    uploadResource
);

// Get all resources belonging to a project.
router.get('/project/:projectId', getResourcesByProject);

// Get one resource by its ID.
router.get('/:resourceId', getResourceById);

module.exports = router;