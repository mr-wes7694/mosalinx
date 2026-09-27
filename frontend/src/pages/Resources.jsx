import { useCallback, useEffect, useState } from "react";
import { auth } from "../firebase";
import { useProject } from "../context/useProject";
import ResourceUpload from "../components/ResourceUpload";
import ResourceSearch from "../components/ResourceSearch";
import ResourceCard from "../components/ResourceCard";
import "./Resources.css";

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

    // Track whether Resource Search is actively displaying a submitted
    // query so the full repository does not duplicate search results.
    const [searchActive, setSearchActive] = useState(false);

    // Control whether the existing Resource Upload form is visible.
    const [showUpload, setShowUpload] = useState(false);

    // Load all resources belonging to the active project using the
    // existing authenticated Resource API workflow.
    const loadResources = useCallback(async () => {
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
    }, [activeProject, loadingProjects, projectError]);

    // Refresh project resources whenever the active project or
    // Resource-loading dependencies change.
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadResources();
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [loadResources]);

    // Download the selected resource through the existing authenticated
    // Resource API and preserve its stored filename for the user.
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

    // Toggle the Resource Upload form without changing its existing
    // upload behavior or backend integration.
    const handleUploadToggle = () => {
        setShowUpload((currentValue) => !currentValue);
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
        <section className="resources-page">
            <div className="resources-workspace">
                {/* Introduce the Resource Repository and keep its primary
                    upload action accessible without permanently showing the form. */}
                <header className="resources-page-header">
                    <div>
                        <h1>Resources</h1>

                        <p>
                            Manage files for{" "}
                            <strong>{activeProject.project_name}</strong>.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="resources-upload-toggle"
                        onClick={handleUploadToggle}
                        aria-expanded={showUpload}
                    >
                        {showUpload
                            ? "Cancel"
                            : "Upload"}
                    </button>
                </header>

                {/* Reveal the existing upload workflow only when requested,
                    preserving its established backend integration. */}
                {showUpload && (
                    <div className="resources-upload-panel">
                        <ResourceUpload
                            projectId={activeProject.project_id}
                            onUploadSuccess={loadResources}
                        />
                    </div>
                )}

                {/* Keep Resource Search within the same project-scoped
                    repository experience as the standard resource listing. */}
                <ResourceSearch
                    resources={resources}
                    onDownload={handleDownload}
                    onSearchStateChange={setSearchActive}
                    downloadingId={downloadingId}
                    error={error}
                />

                {/* Present the complete project repository independently from
                    active search results so clearing search restores this view. */}
                {!searchActive && (
                    <section
                        className="resources-repository"
                        aria-labelledby="project-resources-heading"
                    >
                        <div className="resources-repository-header">
                            <div>
                                <h2 id="project-resources-heading">
                                    Project Resources
                                </h2>

                                <p>
                                    {resources.length}{" "}
                                    {resources.length === 1
                                        ? "resource"
                                        : "resources"}{" "}
                                    available
                                </p>
                            </div>
                        </div>

                        {/* Distinguish an empty repository from a search that
                            simply returned no matching results. */}
                        {resources.length === 0 ? (
                            <div className="resources-empty">
                                <h3>No resources yet</h3>

                                <p>
                                    Upload a resource to start building this
                                    project&apos;s repository.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => setShowUpload(true)}
                                >
                                    Upload Resource
                                </button>
                            </div>
                        ) : (
                            <div className="resources-list">
                                {resources.map((resource) => (
                                    <ResourceCard
                                        key={resource.resource_id}
                                        resource={resource}
                                        onDownload={handleDownload}
                                        downloading={
                                            downloadingId === resource.resource_id
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </section>
    );
}

export default Resources;