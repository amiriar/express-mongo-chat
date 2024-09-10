import axios from 'axios';
// import './App.css';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

function App() {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/chats');
  };

  useEffect(() => {
    axios
      .get('http://localhost:3001/api/dashboard/whoami',{withCredentials: true})
      .catch((err) => {
        if (err?.response?.status) navigate('/');
      });
  }, []);

  return (
    <>
      <h1>AmirChat</h1>
      <div className="card">
        <button onClick={handleClick}>Chats Page</button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
