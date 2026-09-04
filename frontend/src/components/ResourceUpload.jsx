import { useState } from "react";
import "./ResourceUpload.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function ResourceUpload() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [projectId, setProjectId] = useState("");
    const [category, setCategory] = useState("");
    const [fileError, setFileError] = useState("");

    const handleFileChange = (event) => {
        const file = event.target.files[0];

        setFileError("");

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

        const fileInput = document.getElementById("resource-file");

        if (fileInput) {
            fileInput.value = "";
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!selectedFile) {
            setFileError("Please select a file.");
            return;
        }

        // Backend connection will be added in a later task.
        console.log("Resource ready to upload:", {
            file: selectedFile,
            projectId,
            category,
        });
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
                    />

                    {fileError && (
                        <p className="upload-error">
                            {fileError}
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
                    disabled={!selectedFile || !projectId}
                >
                    Upload Resource
                </button>
            </form>
        </section>
    );
}

export default ResourceUpload;