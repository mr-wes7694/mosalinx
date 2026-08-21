import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { auth } from "../firebase";

// Sign up a new user with email and password
export const registerUser = async (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

// Sign in an existing user with email and password
export const loginUser = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

// Sign out the current user
export const logoutUser = async () => {
    return signOut(auth);
};
