const express = require('express');
const multer = require('multer');

const {
    uploadResource,
    getResourcesByProject,
    getResourceById,
} = require('../controllers/resourceController');

const router = express.Router();

// Store uploaded files in memory before saving them locally.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB maximum file size
    },
});

// Upload a new resource.
router.post('/upload', upload.single('file'), uploadResource);

// Get all resources belonging to a project.
router.get('/project/:projectId', getResourcesByProject);

// Get one resource by its ID.
router.get('/:resourceId', getResourceById);

module.exports = router;
