import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useProject } from "../context/ProjectContext";
import ResourceUpload from "../components/ResourceUpload";

const API_URL = "http://localhost:3000/api/resources";

function Resources() {
    const {
        activeProject,
        loadingProjects,
        projectError,
    } = useProject();

    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [downloadingId, setDownloadingId] = useState(null);

    useEffect(() => {
        const loadResources = async () => {
            if (loadingProjects) {
                return;
            }

            if (projectError) {
                setError(projectError);
                setLoading(false);
                return;
            }

            if (!activeProject) {
                setResources([]);
                setError("No active project is available.");
                setLoading(false);
                return;
            }

            const currentUser = auth.currentUser;

            if (!currentUser) {
                setError("You must be signed in to view resources.");
                setLoading(false);
                return;
            }

            try {
                setError("");

                const token = await currentUser.getIdToken();

                const response = await fetch(
                    `${API_URL}/project/${activeProject.project_id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Failed to load resources."
                    );
                }

                setResources(data.resources || []);
            } catch (err) {
                console.error("Failed to load resources:", err);
                setError(
                    err.message || "Failed to load resources."
                );
            } finally {
                setLoading(false);
            }
        };

        loadResources();
    }, [activeProject, loadingProjects, projectError]);

    const handleDownload = async (resource) => {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            setError("You must be signed in to download a resource.");
            return;
        }

        setError("");
        setDownloadingId(resource.resource_id);

        try {
            const token = await currentUser.getIdToken();

            const response = await fetch(
                `${API_URL}/${resource.resource_id}/download`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                let message = "Failed to download resource.";

                try {
                    const data = await response.json();
                    message = data.message || message;
                } catch {
                    // The response may be a non-JSON error.
                }

                throw new Error(message);
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = resource.resource_name;
            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error("Resource download failed:", err);
            setError(
                err.message || "Failed to download resource."
            );
        } finally {
            setDownloadingId(null);
        }
    };

    if (loadingProjects || loading) {
        return <p>Loading resources...</p>;
    }

    if (!activeProject) {
        return (
            <section>
                <h1>Resources</h1>
                <p>No active project is available.</p>
            </section>
        );
    }

    return (
        <section>
            <h1>Resources</h1>

            <p>
                Manage files for{" "}
                <strong>{activeProject.project_name}</strong>.
            </p>

            <ResourceUpload
                projectId={activeProject.project_id}
            />

            {error && (
                <p role="alert">
                    {error}
                </p>
            )}

            <section>
                <h2>Project Resources</h2>

                {resources.length === 0 ? (
                    <p>No resources found.</p>
                ) : (
                    <div>
                        {resources.map((resource) => (
                            <article key={resource.resource_id}>
                                <h3>{resource.resource_name}</h3>

                                <p>
                                    Type:{" "}
                                    {resource.resource_type ||
                                        "Unknown"}
                                </p>

                                <p>
                                    Category:{" "}
                                    {resource.category ||
                                        "Uncategorized"}
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDownload(resource)
                                    }
                                    disabled={
                                        downloadingId ===
                                        resource.resource_id
                                    }
                                >
                                    {downloadingId ===
                                    resource.resource_id
                                        ? "Downloading..."
                                        : "Download"}
                                </button>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </section>
    );
}

export default Resources;