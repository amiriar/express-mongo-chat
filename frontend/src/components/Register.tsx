import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Register.css";
import { Link } from "react-router-dom";

const Register: React.FC = () => {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const requestOtp = async () => {
    if (!phone) {
      setMessage("Please enter your phone number.");
      setError(true);
      return;
    }

    setIsLoading(true);
    try {
      await axios
        .post("http://localhost:3001/api/auth/send-otp", { phone })
        .then((res) => {
          setMessage(`OTP has been sent to your phone. Code: ${res.data.otp}`);
          setError(false);
        });
    } catch (error) {
      setMessage("Failed to send OTP.");
      setError(true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/dashboard/whoami", {
        withCredentials: true,
      })
      .then(() => {
        navigate("/chats");
      });
  }, [navigate]);

  return (
    <div className="register-container">
      <div className="register-form">
        <h2 style={{ fontFamily: "Poppins" }}>Register</h2>
        <p style={{ fontFamily: "Poppins" }}>Enter your phone number to receive an OTP.</p>
        <form onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            className={`input-field ${error ? "error" : ""}`}
            style={{ fontFamily: "Poppins" }}
          />
          <button onClick={requestOtp} disabled={isLoading} className="button" style={{ fontFamily: "Poppins" }}>
            {isLoading ? "Sending OTP..." : "Request OTP"}
          </button>
          {message && (
            <p
              className={`message ${error ? "error-message" : "success-message"}`}
              style={{ fontFamily: "Poppins" }}
            >
              {message}
            </p>
          )}
          <p style={{ marginTop: "1rem", fontFamily: "Poppins" }}>
            You got the Code? <Link to={"/login"}>Login</Link> then!
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
