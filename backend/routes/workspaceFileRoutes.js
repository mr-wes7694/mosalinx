
const express = require('express');

const {
    createWorkspaceFileRecord,
    listWorkspaceFiles,
    getWorkspaceFile,
    updateWorkspaceFileRecord,
} = require('../controllers/workspaceFileController');

const { verifyFirebaseToken } = require('../middleware');

const router = express.Router();

// All Workspace file endpoints require Firebase authentication.
router.post('/', verifyFirebaseToken, createWorkspaceFileRecord);
router.get('/project/:projectId', verifyFirebaseToken, listWorkspaceFiles);
router.get('/:resourceId', verifyFirebaseToken, getWorkspaceFile);
router.put('/:resourceId', verifyFirebaseToken, updateWorkspaceFileRecord);

module.exports = router;
