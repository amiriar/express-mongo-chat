import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Information: React.FC = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const verifyOtp = async () => {
    try {
      await axios
        .post(
          "http://localhost:3001/api/auth/login",
          { phone, otp },
          { withCredentials: true }
        )
        .then((res) => console.log(res));
      setMessage("Login successful.");
      // Redirect to chat or dashboard here
      // navigate("/chats
    } catch (error) {
      setMessage("Invalid OTP or login failed.");
    }
  };

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/dashboard/whoami", {
        withCredentials: true,
      })
      .then((res) => {
        console.log(res);

        // navigate("/chats")
      });
  }, []);

  return (
    <div>
      <input
        type="text"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Enter your phone number"
      />
      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Enter the OTP"
      />
      <button onClick={verifyOtp}>Verify OTP</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Information;
