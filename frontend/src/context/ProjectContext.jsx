import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const ProjectContext = createContext(null);

const API_URL = "http://localhost:3000/api/projects";

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
                    setProjectError("You must be signed in to view projects.");
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

    return (
        <ProjectContext.Provider
            value={{
                projects,
                activeProject,
                setActiveProject,
                loadingProjects,
                projectError,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    return useContext(ProjectContext);
}