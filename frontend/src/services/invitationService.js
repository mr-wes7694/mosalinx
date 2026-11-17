import { API_BASE_URL } from "../config/api";

// Send an invitation to an existing Mosalinx user.
export async function sendProjectInvitation(user, projectId, inviteeEmail) {
  return invitationRequest(user, "/api/invitations", {
    method: "POST",
    body: JSON.stringify({ projectId, inviteeEmail }),
  });
}

// Retrieve invitations awaiting the signed-in user's response.
export async function listPendingInvitations(user) {
  const data = await invitationRequest(user, "/api/invitations/pending");

  if (!Array.isArray(data.invitations)) {
    throw new Error("The server returned an invalid invitation list.");
  }

  return data.invitations;
}

// Accept an invitation to join a project.
export async function acceptProjectInvitation(user, invitationId) {
  return invitationRequest(
    user,
    `/api/invitations/${invitationId}/accept`,
    { method: "POST" }
  );
}

// Handle authentication, requests, and backend errors consistently.
async function invitationRequest(user, path, options = {}) {
  if (!user) {
    throw new Error("You must be signed in to manage invitations.");
  }

  const token = await user.getIdToken();
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
    });
  } catch {
    throw new Error(
      "Unable to connect to the server. Please check your connection and try again."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "The invitation request failed.");
  }

  return data;
}
