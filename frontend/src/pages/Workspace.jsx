import { useProject } from "../context/ProjectContext";

function Workspace() {
    const {
        projects,
        activeProject,
        setActiveProject,
        loadingProjects,
        projectError,
    } = useProject();

    if (loadingProjects) {
        return <p>Loading projects...</p>;
    }

    if (projectError) {
        return <p role="alert">{projectError}</p>;
    }

    if (projects.length === 0) {
        return (
            <section>
                <h1>Workspace</h1>
                <p>No projects are available.</p>
            </section>
        );
    }

    const handleProjectChange = (event) => {
        const selectedProject = projects.find(
            (project) =>
                String(project.project_id) === event.target.value
        );

        if (selectedProject) {
            setActiveProject(selectedProject);
        }
    };

    return (
        <section>
            <h1>Workspace</h1>

            <p>Select the project you want to work with.</p>

            <label htmlFor="project-select">
                Active Project
            </label>

            <select
                id="project-select"
                value={activeProject?.project_id || ""}
                onChange={handleProjectChange}
            >
                {projects.map((project) => (
                    <option
                        key={project.project_id}
                        value={project.project_id}
                    >
                        {project.project_name}
                    </option>
                ))}
            </select>

            {activeProject && (
                <div>
                    <h2>{activeProject.project_name}</h2>
                    <p>
                        {activeProject.description ||
                            "No project description available."}
                    </p>
                </div>
            )}
        </section>
    );
}

export default Workspace;