import { useContext } from "react";
import { ProjectContext } from "./ProjectContextValue";

export function useProject() {
    return useContext(ProjectContext);
}