import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { ProjectContext } from "./ProjectContextValue";
import { API_BASE_URL } from "../config/api";

const API_URL = `${API_BASE_URL}/api/projects`;

// Keep each user's last selected project separate.
const getProjectStorageKey = (uid) => `mosalinx.activeProject.${uid}`;

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectError, setProjectError] = useState("");

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!currentUser) {
          setProjects([]);
          setActiveProject(null);
          setProjectError("You must be signed in to view projects.");
          setLoadingProjects(false);
          return;
        }

        try {
          setLoadingProjects(true);
          setProjectError("");

          // Retrieve the authenticated user's accessible projects.
          const token = await currentUser.getIdToken();

          const response = await fetch(API_URL, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Failed to load projects.");
          }

          if (!active) return;

          const userProjects = data.projects || [];
          const storageKey = getProjectStorageKey(currentUser.uid);
          const savedProjectId = localStorage.getItem(storageKey);

          // Restore the saved project only if the user still has access.
          const restoredProject = userProjects.find(
            (project) => String(project.project_id) === savedProjectId
          );

          setProjects(userProjects);
          setActiveProject(restoredProject || userProjects[0] || null);
        } catch (error) {
          if (!active) return;

          console.error("Failed to load projects:", error);
          setProjectError(error.message || "Failed to load projects.");
          setProjects([]);
          setActiveProject(null);
        } finally {
          if (active) {
            setLoadingProjects(false);
          }
        }
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Persist project changes for the currently authenticated user.
  useEffect(() => {
    const uid = auth.currentUser?.uid;

    if (!uid || loadingProjects || !activeProject?.project_id) return;

    localStorage.setItem(
      getProjectStorageKey(uid),
      String(activeProject.project_id)
    );
  }, [activeProject, loadingProjects]);

  // Refresh accessible projects without requiring the user to sign in again.
  const refreshProjects = useCallback(async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("You must be signed in to refresh projects.");
    }

    const token = await currentUser.getIdToken();

    let response;

    try {
      response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      throw new Error(
        "Unable to connect to the server. Please check your connection and try again."
      );
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Failed to refresh projects.");
    }

    const updatedProjects = data.projects || [];

    setProjects(updatedProjects);
    setActiveProject((previousProject) =>
      updatedProjects.find(
        (project) =>
          String(project.project_id) ===
          String(previousProject?.project_id)
      ) || updatedProjects[0] || null
    );

    setProjectError("");

    return updatedProjects;
  }, []);

  // Create a project and synchronize the shared project state.
  const createProject = async ({ project_name, description }) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("You must be signed in to create a project.");
    }

    // Retrieve the current Firebase authentication token.
    const token = await currentUser.getIdToken();

    // Submit the project details to the backend.
    let response;

    try {
      response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_name,
          description,
        }),
      });
    } catch {
      throw new Error(
        "Unable to connect to the server. Please check your connection and try again."
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create project.");
    }

    if (!data.project?.project_id) {
      throw new Error("The server did not return the created project.");
    }

    // Add the new project and select it immediately.
    setProjects((previousProjects) => [
      ...previousProjects,
      data.project,
    ]);
    setActiveProject(data.project);

    return data.project;
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject,
        loadingProjects,
        projectError,
        createProject,
        refreshProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
