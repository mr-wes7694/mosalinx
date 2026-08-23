import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../services/authService";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");
        try {
            if (isRegistering) {
                await registerUser(email, password, email.split("@")[0]);
                setMessage("Registration successful! You can now log in.");
            } else {
                await loginUser(email, password);
                navigate("/dashboard");
            }
        } catch (error) {
            setMessage(error.message);
        }
    };

    return (
        <div>
          <h1>{isRegistering ? "Create Account" : "Login"}</h1>

          <form onSubmit={handleSubmit}>
            <div>
              <label>Email:</label>
              <br />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <br />
            <div>
              <label>Password:</label>
              <br />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <br />
            <button type="submit">
              {isRegistering ? "Create Account" : "Login"}
            </button>
          </form>

          {message && <p>{message}</p>
          }
          <button
          type="button"
          onClick={() => { setIsRegistering(!isRegistering);
            setMessage("");
          }
        }
        >
          {isRegistering ? "Already have an account? Login" : "Don't have an account? Create one"}
        </button>
        </div>
        );
      }

export default Login;