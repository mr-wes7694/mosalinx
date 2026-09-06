import {
    createUserWithEmailAndPassword,
    deleteUser,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { auth } from "../firebase";

// Register a new user with Firebase and save them to MySQL
export const registerUser = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

    const user = userCredential.user;

    try {
        const response = await fetch("http://localhost:3000/api/users/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                firebaseUid: user.uid,
                displayName: displayName || email.split("@")[0],
                email: user.email,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();

            throw new Error(
                errorData.message || "Failed to register user with backend"
            );
        }

        return response.json();
    } catch (error) {
        try {
            await deleteUser(user);
        } catch (cleanupError) {
            console.error(
                "Failed to clean up Firebase user after backend registration failure:",
                cleanupError
            );
        }

        throw error;
    }
};

// Sign in an existing user
export const loginUser = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

// Sign out the current user
export const logoutUser = async () => {
    return signOut(auth);
};