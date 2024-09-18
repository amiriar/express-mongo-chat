import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // Include the CSS file for styling

const Login: React.FC = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const verifyOtp = async () => {
    if (!phone || !otp) {
      setMessage("Both phone number and OTP are required.");
      setError(true);
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/auth/login`, { phone, otp }, { withCredentials: true });
      setMessage("Login successful.");
      setError(false);
      navigate("/chats");
      // navigate("/settings");
    } catch (error) {
      setMessage("Invalid OTP or login failed.");
      setError(true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/dashboard/whoami`, { withCredentials: true }).then(() => {
      navigate("/chats");
      // navigate("/settings");
    });
  }, [navigate]);

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Login</h2>
        <p>Please enter your phone number and OTP to log in.</p>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter your phone number"
          className={`input-field ${error && !phone ? "error" : ""}`}
        />
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter the OTP"
          className={`input-field ${error && !otp ? "error" : ""}`}
        />
        <button onClick={verifyOtp} disabled={isLoading}>
          {isLoading ? "Verifying..." : "Verify OTP"}
        </button>
        {message && (
          <p className={`message ${error ? "error-message" : "success-message"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
