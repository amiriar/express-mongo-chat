import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const requestOtp = async () => {
    try {
      await axios
        .post('http://localhost:3001/api/auth/send-otp', { phone })
        .then((res) => console.log(res));
      setMessage('OTP has been sent to your phone.');
    } catch (error) {
      setMessage('Failed to send OTP.');
    }
  };

  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:3001/api/dashboard/whoami', {withCredentials: true}).then(() => {
      navigate('/chats');
    });
  });

  return (
    <div>
      <input
        type="text"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Enter your phone number"
      />
      <button onClick={requestOtp}>Request OTP</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Register;
