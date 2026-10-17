const {
    findProjectMemberRole,
    SUPPORTED_PROJECT_ROLES,
} = require('../models/projectModel');

// Check a user's current role for one specific project.
const checkProjectPermission = async (
    projectId,
    userId,
    allowedRoles
) => {
    const normalizedProjectId = Number(projectId);
    const normalizedUserId = Number(userId);

    // Reject invalid IDs and missing permission rules.
    if (
        !Number.isSafeInteger(normalizedProjectId) ||
        normalizedProjectId <= 0 ||
        !Number.isSafeInteger(normalizedUserId) ||
        normalizedUserId <= 0 ||
        !Array.isArray(allowedRoles) ||
        allowedRoles.length === 0
    ) {
        return {
            allowed: false,
            role: null,
        };
    }

    // Never grant permission for an unsupported role.
    const normalizedAllowedRoles = allowedRoles.map((role) =>
        typeof role === 'string' ? role.toLowerCase() : ''
    );

    if (
        normalizedAllowedRoles.some(
            (role) => !SUPPORTED_PROJECT_ROLES.includes(role)
        )
    ) {
        return {
            allowed: false,
            role: null,
        };
    }

    // Look up membership for this exact project and user.
    const currentRole = await findProjectMemberRole(
        normalizedProjectId,
        normalizedUserId
    );

    const normalizedRole =
        typeof currentRole === 'string'
            ? currentRole.toLowerCase()
            : null;

    // A missing membership or unsupported database role is denied.
    if (
        !normalizedRole ||
        !SUPPORTED_PROJECT_ROLES.includes(normalizedRole)
    ) {
        return {
            allowed: false,
            role: normalizedRole,
        };
    }

    return {
        allowed: normalizedAllowedRoles.includes(normalizedRole),
        role: normalizedRole,
    };
};

module.exports = {
    checkProjectPermission,
    SUPPORTED_PROJECT_ROLES,
};
