import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.js";

// Provides components with access to the shared authentication state.
export function useAuth() {
    return useContext(AuthContext);
}
