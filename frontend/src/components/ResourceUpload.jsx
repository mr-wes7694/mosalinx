import { useState } from "react";
import "./ResourceUpload.css";

function ResourceUpload() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [projectId, setProjectId] = useState("");
    const [category, setCategory] = useState("");

    const handleFileChange = (event) => {
        const file = event.target.files[0];

        if (file) {
            setSelectedFile(file);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        // Upload functionality will be added in a later task.
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

                    {selectedFile && (
                        <p className="selected-file">
                            Selected: {selectedFile.name}
                        </p>
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