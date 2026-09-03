import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

// Restricts protected application routes to authenticated users.
export default function ProtectedRoute({ children }) {
    const { currentUser, loading } = useAuth();

    // Wait for Firebase to resolve the current authentication state.
    if (loading) {
        return null;
    }

    // Redirect unauthenticated users to the login page.
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
