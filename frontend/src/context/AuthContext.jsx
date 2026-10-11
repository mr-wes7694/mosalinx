import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { AuthContext } from "./AuthContext.js";
import { getUserProfile } from "../services/profileService.js";

// Provides the current Firebase authentication state to the application.
export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Store the authenticated user's persisted Mosalinx profile.
    const [userProfile, setUserProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState("");

    // Track authentication changes to prevent stale profile responses.
    const authVersionRef = useRef(0);

    // Keep the shared authentication state synchronized with Firebase.
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            // Invalidate profile requests from previous authentication states.
            authVersionRef.current += 1;

            // Clear persisted profile data whenever authentication changes.
            setUserProfile(null);
            setProfileLoading(false);
            setProfileError("");

            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Load the persisted profile whenever the authenticated user changes.
    useEffect(() => {
        if (loading || !currentUser) return;

        const requestVersion = authVersionRef.current;

        let cancelled = false;

        async function loadProfile() {
            setProfileLoading(true);
            setProfileError("");

            try {
                const profile = await getUserProfile(currentUser);

                // Ignore responses from a previous authentication state.
                if (cancelled || requestVersion !== authVersionRef.current) return;

                setUserProfile(profile);
            } catch (error) {
                if (cancelled || requestVersion !== authVersionRef.current) return;

                setUserProfile(null);
                setProfileError(error.message || "Failed to load user profile.");
            } finally {
                // Only finish loading for the active profile request.
                if (!cancelled && requestVersion === authVersionRef.current) {
                    setProfileLoading(false);
                }
            }
        }

        loadProfile();
        // Prevent outdated requests from updating state after cleanup.
        return () => {
            cancelled = true;
        };
    }, [currentUser, loading]);

    return (
        <AuthContext.Provider
            value={{
                currentUser,
                loading,
                userProfile,
                setUserProfile,
                profileLoading,
                profileError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
