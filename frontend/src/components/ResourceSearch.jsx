import { useState } from "react";
import ResourceCard from "./ResourceCard";
import "./ResourceSearch.css";

function ResourceSearch({
    searchResults = [],
    onSearch,
    onSearchClear,
    onDownload,
    onSearchStateChange,
    downloadingId = null,
    loading = false,
    error = "",
}) {
    // Track the current input separately from the submitted search query
    // so filtering occurs only when the user explicitly submits a search.
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Submit a trimmed search term to the backend or restore the default
    // repository state when the input contains only whitespace.
    const handleSubmit = async (event) => {
        event.preventDefault();

        const trimmedQuery = searchInput.trim();

        if (!trimmedQuery) {
            setSearchInput("");
            setSearchQuery("");
            onSearchClear?.();
            onSearchStateChange?.(false);
            return;
        }

        setSearchInput(trimmedQuery);
        setSearchQuery(trimmedQuery);
        onSearchStateChange?.(true);

        await onSearch?.(trimmedQuery);
    };

    // Clear the active search, discard backend search state, and return
    // to the complete project Resource Repository.
    const handleClear = () => {
        setSearchInput("");
        setSearchQuery("");
        onSearchClear?.();
        onSearchStateChange?.(false);
    };

    // Use the submitted query to distinguish the default interface
    // from active search-result states.
    const hasSearch = Boolean(searchQuery);

    return (
        <section
            className="resource-search"
            aria-labelledby="resource-search-heading"
        >
            {/* Introduce the project-scoped Resource Search interface. */}
            <div className="resource-search-header">
                <div>
                    <h2 id="resource-search-heading">
                        Search Resources
                    </h2>

                    <p>
                        Find project resources by name, type, or category.
                    </p>
                </div>
            </div>

            {/* Provide explicit Search and Clear interactions.
                Submitting the form also supports keyboard Enter behavior. */}
            <form
                className="resource-search-form"
                onSubmit={handleSubmit}
                role="search"
            >
                <label htmlFor="resource-search-input">
                    Search project resources
                </label>

                <div className="resource-search-controls">
                    <input
                        id="resource-search-input"
                        type="search"
                        value={searchInput}
                        onChange={(event) =>
                            setSearchInput(event.target.value)
                        }
                        placeholder="Search by name, type, or category"
                        maxLength={100}
                        autoComplete="off"
                        disabled={loading}
                    />

                    <button
                        type="submit"
                        disabled={loading || !searchInput.trim()}
                    >
                        Search
                    </button>

                    {hasSearch && (
                        <button
                            type="button"
                            className="resource-search-clear"
                            onClick={handleClear}
                            disabled={loading}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </form>

            {/* Display search-level errors supplied by the parent
                Resource workflow. */}
            {error && (
                <p
                    className="resource-search-message resource-search-error"
                    role="alert"
                >
                    {error}
                </p>
            )}

            {/* Provide feedback while Resource data is loading. */}
            {loading && (
                <p
                    className="resource-search-message"
                    aria-live="polite"
                >
                    Loading resources...
                </p>
            )}

            {/* Show guidance before the user submits a search. */}
            {!loading && !error && !hasSearch && (
                <p className="resource-search-message">
                    Enter a search term to find resources in this project.
                </p>
            )}

            {/* Keep an unsuccessful search distinct from an empty
                Resource Repository. */}
            {!loading &&
                !error &&
                hasSearch &&
                searchResults.length === 0 && (
                    <div className="resource-search-empty">
                        <h3>No matching resources</h3>

                        <p>
                            No resources matched &quot;{searchQuery}&quot;.
                            Try another name, type, or category.
                        </p>

                    </div>
                )}

            {/* Present matching resources using the metadata currently
                supported by the Resource Repository. */}
            {!loading &&
                !error &&
                hasSearch &&
                searchResults.length > 0 && (
                    <div className="resource-search-results">
                        <div className="resource-search-results-header">
                            <h3>Search Results</h3>

                            <p aria-live="polite">
                                {searchResults.length}{" "}
                                {searchResults.length === 1
                                    ? "resource"
                                    : "resources"}{" "}
                                found for &quot;{searchQuery}&quot;.
                            </p>
                        </div>

                        <div className="resource-search-list">
                            {searchResults.map((resource) => (
                                <ResourceCard
                                    key={resource.resource_id}
                                    resource={resource}
                                    onDownload={onDownload}
                                    downloading={
                                        downloadingId === resource.resource_id
                                    }
                                />
                            ))}
                        </div>
                    </div>
                )}
        </section>
    );
}

export default ResourceSearch;
