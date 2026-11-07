import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./ResourceDeleteModal.css";

// Confirmation step shown before a resource is deleted. It names the
// resource, states that deletion is permanent, and only calls `onConfirm`
// after an explicit "Confirm Delete". `onConfirm` is the integration point
// for the Resource Delete API: it should resolve on success or throw an
// Error whose message is shown here so the user can retry or cancel.
function ResourceDeleteModal({
    resource,
    details = [],
    onConfirm,
    onClose,
    returnFocusRef,
}) {
    const titleId = useId();
    const descriptionId = useId();
    const dialogRef = useRef(null);
    const cancelRef = useRef(null);

    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    // A ref guards against a second click or Enter press landing before
    // React has re-rendered the buttons as disabled.
    const submittingRef = useRef(false);

    // Move focus into the dialog on open (starting on the safe choice),
    // lock page scrolling, and hand focus back to the Delete button after.
    useEffect(() => {
        const returnTarget = returnFocusRef?.current;
        const previousOverflow = document.body.style.overflow;

        cancelRef.current?.focus();
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
            // After a successful delete the card is gone, so this may be null.
            returnTarget?.isConnected && returnTarget.focus();
        };
    }, [returnFocusRef]);

    // Cancel is blocked while a request is running so the dialog cannot
    // disappear in the middle of a deletion.
    const requestClose = () => {
        if (!submittingRef.current) {
            onClose();
        }
    };

    const handleConfirm = async () => {
        if (submittingRef.current) {
            return;
        }

        submittingRef.current = true;
        setDeleting(true);
        setError("");

        try {
            await onConfirm();
            // On success the parent removes the resource, which unmounts
            // this dialog. Keep the guard on so it cannot fire twice.
        } catch (err) {
            setError(err?.message || "Failed to delete resource.");
            submittingRef.current = false;
            setDeleting(false);
        }
    };

    // Escape cancels, and Tab stays inside the dialog.
    const handleKeyDown = (event) => {
        if (event.key === "Escape") {
            event.stopPropagation();
            requestClose();
            return;
        }

        if (event.key !== "Tab") {
            return;
        }

        const focusable = [
            ...dialogRef.current.querySelectorAll("button:not(:disabled)"),
        ];

        if (focusable.length === 0) {
            event.preventDefault();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    // Rendered in a portal so the resource card's button styles and layout
    // do not affect the dialog.
    return createPortal(
        <div
            className="resource-delete-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    requestClose();
                }
            }}
        >
            <div
                ref={dialogRef}
                className="resource-delete-modal"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                onKeyDown={handleKeyDown}
            >
                <h2 id={titleId}>Delete this resource?</h2>

                <div className="resource-delete-target">
                    <strong>{resource.resource_name}</strong>

                    {details.length > 0 && (
                        <span>{details.join(" • ")}</span>
                    )}
                </div>

                <p id={descriptionId} className="resource-delete-warning">
                    This permanently deletes the file and its record from
                    the project. This action cannot be undone.
                </p>

                {error && (
                    <p className="resource-delete-error" role="alert">
                        {error}
                    </p>
                )}

                <div className="resource-delete-actions">
                    <button
                        ref={cancelRef}
                        type="button"
                        className="resource-delete-cancel"
                        onClick={requestClose}
                        disabled={deleting}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="resource-delete-confirm"
                        onClick={handleConfirm}
                        disabled={deleting}
                    >
                        {deleting ? "Deleting..." : "Confirm Delete"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default ResourceDeleteModal;