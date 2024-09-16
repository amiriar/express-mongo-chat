import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Settings.css"; // Import CSS file for custom styles

function Settings() {
  const navigate = useNavigate();
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState<File | null>(null);
  const [profileName, setProfileName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");

  const handleClick = () => {
    const formData = new FormData();
    formData.append("firstname", firstname);
    formData.append("lastname", lastname);
    formData.append("username", username);
    formData.append("email", email);
    if (profile) {
      formData.append("profile", profile);
    }
    formData.append("bio", bio);
    
    axios
      .post("http://localhost:3001/api/dashboard", formData, {
        withCredentials: true,
      })
      .then(() => {
        navigate("/chats");
      })
      .catch((err) => {
        if (err?.response?.status === 401) navigate("/");
      });
  };

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/dashboard/whoami", {
        withCredentials: true,
      })
      .then((response) => {
        setFirstname(response.data.firstname);
        setLastname(response.data.lastname);
        setUsername(response.data.username);
        setProfileName(response.data.profile);
        setEmail(response.data.email);
        setBio(response.data.bio);
        
      })
      .catch((err) => {
        if (err?.response?.status === 401) navigate("/");
      });
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfile(e.target.files[0]);
    }
  };

  return (
    <div className="settings-container">
      <h1>Settings</h1>
      <p className="settings-description">
        Here, you can change, add, or remove data from your profile!
      </p>
      <div className="settings-form">
        <div className="form-group">
          <label htmlFor="firstname">First Name</label>
          <input
            type="text"
            id="firstname"
            className="input-field"
            value={firstname}
            onChange={(e): void => setFirstname(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastname">Last Name</label>
          <input
            type="text"
            id="lastname"
            className="input-field"
            value={lastname}
            onChange={(e): void => setLastname(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            className="input-field"
            value={username}
            onChange={(e): void => setUsername(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="text"
            id="email"
            className="input-field"
            value={email}
            onChange={(e): void => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="profilePicture">Profile Picture</label>
          <input
            type="file"
            id="profilePicture"
            accept="image/*"
            onChange={handleProfileChange}
          />
          <br />
          {profileName ? (
            <div>
              <span>Current Prictue:</span>
              <img
                src={`http://localhost:3001/${profileName}`}
                alt={profileName}
                height={50}
                width={50}
                style={{ objectFit: "cover" }}
              />
            </div>
          ) : (
            ""
          )}
        </div>

        <div className="form-group">
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            className="textarea-field"
            cols={30}
            rows={5}
            maxLength={75}
            value={bio}
            onChange={(e): void => setBio(e.target.value)}
          ></textarea>
        </div>

        <button className="submit-button" onClick={handleClick}>
          Submit
        </button>
      </div>
    </div>
  );
}

export default Settings;
