import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { logoutUser } from "../services/authService";

function Dashboard() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                navigate("/login");
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await logoutUser();
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    if (!user) {
        return <p>Loading...</p>;
    }

    return (
        <div>
            <h1>Dashboard</h1>

            <p>Welcome!</p>
            <p>Email: {user.email}</p>

            <button onClick={handleLogout}>
                Logout
            </button>
        </div>
    );
}

export default Dashboard;