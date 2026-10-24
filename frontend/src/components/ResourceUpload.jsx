import { useRef, useState } from "react";
import { auth } from "../firebase";
import { API_BASE_URL } from "../config/api";
import ResourceCategory from "./ResourceCategory";
import "./ResourceUpload.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function ResourceUpload({ projectId, onUploadSuccess }) {
  // Track the file input and whether a file is being dragged over the drop zone.
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState("");
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Validate files consistently whether selected or dropped.
  const selectFile = (file) => {
    setFileError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setFileError("File size cannot exceed 10 MB.");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    setSelectedFile(file);
  };

  // Handle files selected through the browser's file chooser.
  const handleFileChange = (event) => {
    selectFile(event.target.files?.[0]);
  };

  // Clear the selected file and reset the native file input.
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Highlight the drop zone when a file is dragged over it.
  const handleDragOver = (event) => {
    event.preventDefault();

    if (!uploading) {
      setIsDragging(true);
    }
  };

  // Remove the highlight when a dragged file leaves the drop zone.
  const handleDragLeave = (event) => {
    event.preventDefault();

    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsDragging(false);
    }
  };

  // Validate dropped files using the same rules as the file chooser.
  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    if (uploading) {
      return;
    }

    const files = event.dataTransfer.files;

    // Clear any previous browser selection before processing dropped files.
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (files.length > 1) {
      setSelectedFile(null);
      setFileError("Please upload one file at a time.");
      return;
    }

    selectFile(files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFileError("");

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
        `${API_BASE_URL}/api/resources/upload`,
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

      setSelectedFile(null);
      setCategory("");

      // Notify the parent after the upload succeeds so it can
      // close the form, refresh the repository, and show feedback.
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Reset the native file input after a successful upload.
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (error) {
      console.error("Resource upload failed:", error);
      setFileError(
        error instanceof TypeError
          ? "Unable to upload resource. Please check your connection and try again."
          : error.message || "Failed to upload resource."
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
          {/* Support drag-and-drop and traditional file browsing through
              one shared file input and validation workflow. */}
          <label htmlFor="resource-file">
            Select File
          </label>

          <div
            className={`resource-drop-zone${isDragging ? " is-dragging" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              id="resource-file"
              className="resource-file-input"
              type="file"
              onChange={handleFileChange}
              disabled={uploading}
            />

            <label
              htmlFor="resource-file"
              className="resource-drop-zone-content"
            >
              <span className="resource-drop-zone-icon" aria-hidden="true">
                ↑
              </span>

              <strong>Drag and drop your file here</strong>

              <span>or click to browse your device</span>

              <span className="resource-drop-zone-hint">
                Maximum file size: 10 MB
              </span>
            </label>
          </div>

          {fileError && (
            <p className="upload-error">
              {fileError}
            </p>
          )}

          {/* Preview the selected file and allow removal before uploading. */}
          {selectedFile && (
            <div className="selected-file">
              <div className="selected-file-details">
                <span className="selected-file-icon" aria-hidden="true">
                  📄
                </span>

                <div className="selected-file-info">
                  <strong title={selectedFile.name}>
                    {selectedFile.name}
                  </strong>

                  <span>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    {" · "}Ready to upload
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="selected-file-remove"
                onClick={handleRemoveFile}
                disabled={uploading}
                aria-label={`Remove ${selectedFile.name}`}
              >
                Remove
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