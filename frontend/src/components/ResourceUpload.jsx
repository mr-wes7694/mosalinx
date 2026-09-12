import { useState } from "react";
import { auth } from "../firebase";
import ResourceCategory from "./ResourceCategory";
import "./ResourceUpload.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function ResourceUpload({ projectId }) {
    const [selectedFile, setSelectedFile] = useState(null);
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
            setFileError("No active project is selected.");
            return;
        }

        const currentUser = auth.currentUser;

        if (!currentUser) {
            setFileError("You must be signed in to upload a resource.");
            return;
        }

        setUploading(true);

        try {
            const token = await currentUser.getIdToken();

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

            setSelectedFile(null);
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

                <ResourceCategory
                    value={category}
                    onChange={setCategory}
                    disabled={uploading}
                />

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