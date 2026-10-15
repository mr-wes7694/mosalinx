import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { ProjectContext } from "./ProjectContextValue";
import { API_BASE_URL } from "../config/api";

const API_URL = `${API_BASE_URL}/api/projects`;

export function ProjectProvider({ children }) {
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [projectError, setProjectError] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            async (currentUser) => {
                if (!currentUser) {
                    setProjects([]);
                    setActiveProject(null);
                    setProjectError(
                        "You must be signed in to view projects."
                    );
                    setLoadingProjects(false);
                    return;
                }

                try {
                    setLoadingProjects(true);
                    setProjectError("");

                    // Get the Firebase authentication token.
                    const token = await currentUser.getIdToken();

                    const response = await fetch(API_URL, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data.message || "Failed to load projects."
                        );
                    }

                    const userProjects = data.projects || [];

                    setProjects(userProjects);

                    // Use the first accessible project as the active project.
                    setActiveProject(userProjects[0] || null);
                } catch (error) {
                    console.error("Failed to load projects:", error);
                    setProjectError(
                        error.message || "Failed to load projects."
                    );
                    setProjects([]);
                    setActiveProject(null);
                } finally {
                    setLoadingProjects(false);
                }
            }
        );

        return () => unsubscribe();
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
                throw new Error(
                    data.message || "Failed to create project."
                );
            }

            if (!data.project?.project_id) {
                throw new Error(
                    "The server did not return the created project."
                );
            }

            // Add the persisted project and select it for the workspace.
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
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
}