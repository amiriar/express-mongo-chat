// import './App.css';
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/chats');
  };

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
