import "./ResourceCard.css";

function ResourceCard({
    resource,
    onDownload,
    downloading = false,
}) {
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

    return (
        <article className="resource-card">
            <div className="resource-card-info">
                <h3>{resource.resource_name}</h3>

                {/* Present commonly scanned metadata consistently anywhere
                    a Resource appears in the repository interface. */}
                <div className="resource-card-metadata">
                    <span className="resource-card-type">
                        {resourceType}
                    </span>

                    <span className="resource-card-category">
                        {resource.category || "Uncategorized"}
                    </span>

                    <span>
                        {formatFileSize(resource.file_size)}
                    </span>

                    <span>
                        Uploaded{" "}
                        {formatUploadDate(resource.uploaded_at)}
                    </span>
                </div>
            </div>

            {/* Reuse the download workflow supplied by the parent rather
                than coupling Resource presentation to API behavior. */}
            {onDownload && (
                <button
                    type="button"
                    onClick={() => onDownload(resource)}
                    disabled={downloading}
                >
                    {downloading
                        ? "Downloading..."
                        : "Download"}
                </button>
            )}
        </article>
    );
}

export default ResourceCard;
