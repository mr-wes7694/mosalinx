
const pool = require('../config/database');

const createResource = async (
    projectId,
    uploadedBy,
    resourceName,
    resourceType,
    fileSize,
    category,
    storagePath
) => {
    const sql =
        'INSERT INTO resources ' +
        '(project_id, uploaded_by, resource_name, resource_type, file_size, category, storage_path) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?)';

    const [result] = await pool.query(sql, [
        projectId,
        uploadedBy,
        resourceName,
        resourceType,
        fileSize,
        category,
        storagePath,
    ]);

    return {
        resourceId: result.insertId,
        projectId,
        uploadedBy,
        resourceName,
        resourceType,
        fileSize,
        category,
        storagePath,
    };
};

// Create a Workspace file using the existing resources table.
const createWorkspaceFile = async (
    projectId,
    uploadedBy,
    resourceName,
    fileType,
    fileSize,
    category,
    storagePath
) => {
    return createResource(
        projectId,
        uploadedBy,
        resourceName,
        `workspace_${fileType}`,
        fileSize,
        category,
        storagePath
    );
};

// Update the Firebase Storage path after the MySQL resource ID is created.
const updateResourceStoragePath = async (resourceId, storagePath) => {
    const sql =
        'UPDATE resources SET storage_path = ? WHERE resource_id = ?';

    await pool.query(sql, [storagePath, resourceId]);
};

// Update only the category of an ordinary resource.
const updateResourceCategory = async (resourceId, category) => {
    const sql =
        'UPDATE resources SET category = ? ' +
        "WHERE resource_id = ? AND LEFT(resource_type, 10) != 'workspace_'";

    const [result] = await pool.query(sql, [category, resourceId]);

    return result.affectedRows > 0;
};

// Delete a resource record if the file upload fails.
const deleteResourceById = async (resourceId) => {
    const sql = 'DELETE FROM resources WHERE resource_id = ?';

    await pool.query(sql, [resourceId]);
};

// Delete only ordinary resource records, not Workspace files.
const deleteResourceRecord = async (resourceId) => {
    const sql =
        'DELETE FROM resources WHERE resource_id = ? ' +
        "AND LEFT(resource_type, 10) != 'workspace_'";

    const [result] = await pool.query(sql, [resourceId]);

    return result.affectedRows > 0;
};

// Find a resource by ID.
const findResourceById = async (resourceId) => {
    const sql =
        'SELECT resource_id, project_id, uploaded_by, resource_name, ' +
        'resource_type, file_size, category, storage_path, uploaded_at, updated_at ' +
        'FROM resources WHERE resource_id = ? LIMIT 1';

    const [rows] = await pool.query(sql, [resourceId]);

    return rows[0] || null;
};

// List all resources in a project.
const findResourcesByProject = async (projectId) => {
	const sql =
	    'SELECT resource_id, project_id, uploaded_by, resource_name, ' +
	    'resource_type, file_size, category, storage_path, uploaded_at, updated_at ' +
	    'FROM resources WHERE project_id = ? ' +
	    "AND LEFT(resource_type, 10) != 'workspace_' " +
	    'ORDER BY uploaded_at DESC';

    const [rows] = await pool.query(sql, [projectId]);

    return rows;
};

// Find a Workspace file by ID without matching ordinary resources.
const findWorkspaceFileById = async (resourceId) => {
    const sql =
        'SELECT resource_id, project_id, uploaded_by, resource_name, ' +
        'resource_type, file_size, category, storage_path, uploaded_at, updated_at ' +
        'FROM resources ' +
        "WHERE resource_id = ? AND LEFT(resource_type, 10) = 'workspace_' " +
        'LIMIT 1';

    const [rows] = await pool.query(sql, [resourceId]);

    return rows[0] || null;
};

// List only Workspace files in a project.
const findWorkspaceFilesByProject = async (projectId) => {
    const sql =
        'SELECT resource_id, project_id, uploaded_by, resource_name, ' +
        'resource_type, file_size, category, storage_path, uploaded_at, updated_at ' +
        'FROM resources ' +
        "WHERE project_id = ? AND LEFT(resource_type, 10) = 'workspace_' " +
        'ORDER BY updated_at DESC';

    const [rows] = await pool.query(sql, [projectId]);

    return rows;
};

// Update Workspace file metadata without changing its storage location.
const updateWorkspaceFile = async (
    resourceId,
    resourceName,
    fileSize,
    category
) => {
    const sql =
        'UPDATE resources SET resource_name = ?, file_size = ?, category = ? ' +
        "WHERE resource_id = ? AND LEFT(resource_type, 10) = 'workspace_'";

    const [result] = await pool.query(sql, [
        resourceName,
        fileSize,
        category,
        resourceId,
    ]);

    return result.affectedRows > 0;
};

// Search ordinary resources within one project.
const searchResourcesByProject = async (projectId, searchTerm) => {
	const sql =
	    'SELECT resource_id, project_id, uploaded_by, resource_name, ' +
	    'resource_type, file_size, category, storage_path, uploaded_at, updated_at ' +
	    'FROM resources ' +
	    'WHERE project_id = ? ' +
	    "AND LEFT(resource_type, 10) != 'workspace_' " +
	    'AND (resource_name LIKE ? OR resource_type LIKE ? OR COALESCE(category, \'Uncategorized\') LIKE ?) ' +
	    'ORDER BY uploaded_at DESC';

    const searchPattern = `%${searchTerm}%`;

    const [rows] = await pool.query(sql, [
        projectId,
        searchPattern,
        searchPattern,
        searchPattern,
    ]);

    return rows;
};

// Check whether a user belongs to a project.
const isProjectMember = async (projectId, userId) => {
    const sql =
        'SELECT 1 FROM project_members ' +
        'WHERE project_id = ? AND user_id = ? LIMIT 1';

    const [rows] = await pool.query(sql, [
        projectId,
        userId,
    ]);

    return rows.length > 0;
};

module.exports = {
    createResource,
    createWorkspaceFile,
    updateResourceStoragePath,
    updateResourceCategory,
    deleteResourceById,
    deleteResourceRecord,
    findResourceById,
    findWorkspaceFileById,
    findWorkspaceFilesByProject,
    updateWorkspaceFile,
    findResourcesByProject,
    searchResourcesByProject,
    isProjectMember,
};