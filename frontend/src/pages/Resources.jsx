import { useEffect, useState } from "react";
import { auth } from "../firebase";

const API_URL = "http://localhost:3000/api/resources";
const PROJECT_ID = "2";

function Resources() {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [downloadingId, setDownloadingId] = useState(null);

    useEffect(() => {
        const loadResources = async () => {
            const currentUser = auth.currentUser;

            if (!currentUser) {
                setError("You must be signed in to view resources.");
                setLoading(false);
                return;
            }

            try {
                // Get the Firebase authentication token.
                const token = await currentUser.getIdToken();

                const response = await fetch(
                    `${API_URL}/project/${PROJECT_ID}`,
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
    }, []);

    const handleDownload = async (resource) => {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            setError("You must be signed in to download a resource.");
            return;
        }

        setError("");
        setDownloadingId(resource.resource_id);

        try {
            // Get the Firebase authentication token.
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

            // Convert the response into a downloadable browser file.
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

    if (loading) {
        return <p>Loading resources...</p>;
    }

    return (
        <section>
            <h1>Resources</h1>
            <p>Project resources for project {PROJECT_ID}.</p>

            {error && (
                <p role="alert">
                    {error}
                </p>
            )}

            {resources.length === 0 ? (
                <p>No resources found.</p>
            ) : (
                <div>
                    {resources.map((resource) => (
                        <article key={resource.resource_id}>
                            <h2>{resource.resource_name}</h2>

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
    );
}

export default Resources;
