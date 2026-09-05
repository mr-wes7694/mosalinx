import { useState } from "react";
import { auth } from "../firebase";
import "./ResourceUpload.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function ResourceUpload() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [projectId, setProjectId] = useState("");
    const [category, setCategory] = useState("");
    const [fileError, setFileError] = useState("");
    const [uploadStatus, setUploadStatus] = useState("");
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (event) => {
        const file = event.target.files[0];

        setFileError("");
        setUploadStatus("");

        if (!file) {
            setSelectedFile(null);
            return;
        }

        // Match the backend's 10 MB file size limit.
        if (file.size > MAX_FILE_SIZE) {
            setSelectedFile(null);
            setFileError("File size cannot exceed 10 MB.");
            event.target.value = "";
            return;
        }

        setSelectedFile(file);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setFileError("");
        setUploadStatus("");

        const fileInput = document.getElementById("resource-file");

        if (fileInput) {
            fileInput.value = "";
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setFileError("");
        setUploadStatus("");

        if (!selectedFile) {
            setFileError("Please select a file.");
            return;
        }

        if (!projectId) {
            setFileError("Please enter a project ID.");
            return;
        }

        const currentUser = auth.currentUser;

        if (!currentUser) {
            setFileError("You must be signed in to upload a resource.");
            return;
        }

        setUploading(true);

        try {
            // Get the Firebase authentication token.
            const token = await currentUser.getIdToken();

            // Create the multipart form data expected by the backend.
            const formData = new FormData();

            formData.append("file", selectedFile);
            formData.append("projectId", projectId);

            if (category) {
                formData.append("category", category);
            }

            const response = await fetch(
                "http://localhost:3000/api/resources/upload",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to upload resource."
                );
            }

            setUploadStatus("Resource uploaded successfully.");

            // Clear the form after a successful upload.
            setSelectedFile(null);
            setProjectId("");
            setCategory("");

            const fileInput = document.getElementById("resource-file");

            if (fileInput) {
                fileInput.value = "";
            }
        } catch (error) {
            console.error("Resource upload failed:", error);
            setFileError(
                error.message || "Failed to upload resource."
            );
        } finally {
            setUploading(false);
        }
    };

    return (
        <section className="resource-upload">
            <div className="resource-upload-header">
                <h2>Upload Resource</h2>
                <p>Add a file to your project workspace.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="upload-field">
                    <label htmlFor="resource-file">
                        Select File
                    </label>

                    <input
                        id="resource-file"
                        type="file"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />

                    {fileError && (
                        <p className="upload-error">
                            {fileError}
                        </p>
                    )}

                    {uploadStatus && (
                        <p className="upload-success">
                            {uploadStatus}
                        </p>
                    )}

                    {selectedFile && (
                        <div className="selected-file">
                            <p>
                                <strong>Selected:</strong>{" "}
                                {selectedFile.name}
                            </p>

                            <p>
                                Size:{" "}
                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>

                            <button
                                type="button"
                                onClick={handleRemoveFile}
                                disabled={uploading}
                            >
                                Remove File
                            </button>
                        </div>
                    )}
                </div>

                <div className="upload-field">
                    <label htmlFor="project-id">
                        Project ID
                    </label>

                    <input
                        id="project-id"
                        type="text"
                        value={projectId}
                        onChange={(event) =>
                            setProjectId(event.target.value)
                        }
                        placeholder="Enter project ID"
                        disabled={uploading}
                    />
                </div>

                <div className="upload-field">
                    <label htmlFor="resource-category">
                        Category
                    </label>

                    <select
                        id="resource-category"
                        value={category}
                        onChange={(event) =>
                            setCategory(event.target.value)
                        }
                        disabled={uploading}
                    >
                        <option value="">Select a category</option>
                        <option value="document">Document</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={!selectedFile || !projectId || uploading}
                >
                    {uploading ? "Uploading..." : "Upload Resource"}
                </button>
            </form>
        </section>
    );
}

export default ResourceUpload;