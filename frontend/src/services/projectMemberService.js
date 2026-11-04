import { API_BASE_URL } from "../config/api";

// Retrieve the members of a project from the backend.
export async function listProjectMembers(user, projectId) {
    if (!user) {
        throw new Error("You must be signed in to view project members.");
    }

    if (!Number.isInteger(Number(projectId)) || Number(projectId) <= 0) {
        throw new Error("A valid project must be selected.");
    }

    // Get the Firebase authentication token.
    const token = await user.getIdToken();

    let response;

    try {
        response = await fetch(
            `${API_BASE_URL}/api/projects/${projectId}/members`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
    } catch {
        throw new Error(
            "Unable to connect to the server. Please check your connection and try again."
        );
    }

    // Read the backend response.
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message || "Failed to load project members."
        );
    }

    if (!Array.isArray(data.members)) {
        throw new Error("The server returned an invalid member list.");
    }

    return data.members;
}
