const DEFAULT_CATEGORIES = [
    { value: "document", label: "Document" },
    { value: "image", label: "Image" },
    { value: "video", label: "Video" },
    { value: "audio", label: "Audio" },
    { value: "other", label: "Other" },
];

function ResourceCategory({
    value = "",
    onChange,
    categories = DEFAULT_CATEGORIES,
    disabled = false,
    required = false,
    error = "",
}) {
    const selectedValue = value ?? "";

    const validCategories = Array.isArray(categories)
        ? categories.filter(
            (category) =>
                category &&
                typeof category.value === "string" &&
                typeof category.label === "string"
        )
        : DEFAULT_CATEGORIES;

    const validValues = validCategories.map(
        (category) => category.value
    );

    const hasInvalidValue =
        selectedValue !== "" &&
        !validValues.includes(selectedValue);

    const handleChange = (event) => {
        if (typeof onChange !== "function") {
            return;
        }

        onChange(event.target.value);
    };

    return (
        <div className="upload-field">
            <label htmlFor="resource-category">
                Category
            </label>

            <select
                id="resource-category"
                value={hasInvalidValue ? "" : selectedValue}
                onChange={handleChange}
                disabled={disabled}
                required={required}
                aria-invalid={Boolean(error) || hasInvalidValue}
                aria-describedby={
                    error || hasInvalidValue
                        ? "resource-category-error"
                        : undefined
                }
            >
                <option value="">Select a category</option>

                {validCategories.map((category) => (
                    <option
                        key={category.value}
                        value={category.value}
                    >
                        {category.label}
                    </option>
                ))}
            </select>

            {(error || hasInvalidValue) && (
                <p
                    id="resource-category-error"
                    className="upload-error"
                    role="alert"
                >
                    {error || "Please select a valid category."}
                </p>
            )}
        </div>
    );
}

export default ResourceCategory;
