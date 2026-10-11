import { useId, useState } from "react";
import "./ResourceCard.css";

const RESOURCE_CATEGORIES = [
    { value: "", label: "Uncategorized" },
    { value: "document", label: "Document" },
    { value: "image", label: "Image" },
    { value: "video", label: "Video" },
    { value: "audio", label: "Audio" },
    { value: "other", label: "Other" },
];

function ResourceCard({
    resource,
    onDownload,
    downloading = false,
    canEdit = false,
    onSaveCategory,
}) {
    const categoryId = useId();
    const [editing, setEditing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(
        resource.category ?? ""
    );
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState("");

    // Convert stored MIME types into concise labels that are easier
    // to scan than the raw values returned by file uploads.
    const formatResourceType = (resourceType, resourceName) => {
        const normalizedType = String(resourceType || "").toLowerCase();
        const fileExtension = String(resourceName || "")
            .split(".")
            .pop()
            .toUpperCase();

        const knownTypes = {
            "application/pdf": "PDF",
            "application/msword": "DOC",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                "DOCX",
            "application/vnd.ms-excel": "XLS",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                "XLSX",
            "application/vnd.ms-powerpoint": "PPT",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation":
                "PPTX",
            "text/plain": "TXT",
            "text/csv": "CSV",
            "application/zip": "ZIP",
            "image/jpeg": "JPG",
            "image/png": "PNG",
            "image/gif": "GIF",
            "image/webp": "WEBP",
            "audio/mpeg": "MP3",
            "video/mp4": "MP4",
        };

        if (knownTypes[normalizedType]) {
            return knownTypes[normalizedType];
        }

        // Fall back to the filename extension when the MIME type is
        // unfamiliar but the stored resource name provides one.
        if (
            fileExtension &&
            fileExtension !== String(resourceName || "").toUpperCase()
        ) {
            return fileExtension;
        }

        return resourceType || "Unknown type";
    };

    // Convert stored byte values into human-readable file sizes.
    const formatFileSize = (bytes) => {
        const numericBytes = Number(bytes);

        if (!Number.isFinite(numericBytes) || numericBytes < 0) {
            return "Unknown size";
        }

        if (numericBytes === 0) {
            return "0 KB";
        }

        const kilobytes = numericBytes / 1024;

        if (kilobytes < 1024) {
            return `${kilobytes.toFixed(1)} KB`;
        }

        return `${(kilobytes / 1024).toFixed(1)} MB`;
    };

    // Format the stored upload timestamp for Resource metadata display.
    const formatUploadDate = (dateValue) => {
        if (!dateValue) {
            return "Unknown date";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Unknown date";
        }

        return date.toLocaleDateString();
    };

    const resourceType = formatResourceType(
        resource.resource_type,
        resource.resource_name
    );

    // Begin editing with the resource's current persisted category.
    const handleEdit = () => {
        setSelectedCategory(resource.category ?? "");
        setEditError("");
        setEditing(true);
    };

    // Discard unsaved changes and restore the normal card view.
    const handleCancel = () => {
        setSelectedCategory(resource.category ?? "");
        setEditError("");
        setEditing(false);
    };

    // Delegate persistence to the parent Resource Repository workflow.
    const handleSave = async () => {
        if (!onSaveCategory || saving) return;

        setSaving(true);
        setEditError("");

        try {
            await onSaveCategory(
                resource,
                selectedCategory === "" ? null : selectedCategory
            );
            setEditing(false);
        } catch (error) {
            setEditError(
                error.message || "Failed to update resource category."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <article className="resource-card">
            <div className="resource-card-info">
                <h3>{resource.resource_name}</h3>

                {/* Present resource metadata consistently in both
                    repository listings and search results. */}
                <div className="resource-card-metadata">
                    <span className="resource-card-type">
                        {resourceType}
                    </span>

                    <span className="resource-card-category">
                        {resource.category || "Uncategorized"}
                    </span>

                    <span>{formatFileSize(resource.file_size)}</span>

                    <span>
                        Uploaded {formatUploadDate(resource.uploaded_at)}
                    </span>
                </div>

                {/* Edit organizational metadata without changing the
                    resource's stored file or leaving the current page. */}
                {editing && (
                    <div className="resource-card-editor">
                        <label htmlFor={categoryId}>
                            Resource Category
                        </label>

                        <select
                            id={categoryId}
                            value={selectedCategory}
                            onChange={(event) =>
                                setSelectedCategory(event.target.value)
                            }
                            disabled={saving}
                        >
                            {RESOURCE_CATEGORIES.map((category) => (
                                <option
                                    key={category.value}
                                    value={category.value}
                                >
                                    {category.label}
                                </option>
                            ))}
                        </select>

                        {editError && (
                            <p
                                className="resource-card-edit-error"
                                role="alert"
                            >
                                {editError}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Keep Download available while exposing metadata editing
                only when the parent confirms the user's eligibility. */}
            <div className="resource-card-actions">
                {onDownload && (
                    <button
                        type="button"
                        onClick={() => onDownload(resource)}
                        disabled={downloading}
                    >
                        {downloading ? "Downloading..." : "Download"}
                    </button>
                )}

                {canEdit && onSaveCategory && (
                    editing ? (
                        <>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>

                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={handleEdit}
                        >
                            Edit
                        </button>
                    )
                )}
            </div>
        </article>
    );
}

export default ResourceCard;
