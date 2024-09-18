import { IUser } from "./types/types";

interface OnlineUsersProps {
  offlineUsers: IUser[];
  pvHandler: (user: IUser) => void;
}

function OfflineUsers({ offlineUsers, pvHandler }: OnlineUsersProps) {
  return (
    <div
      className="offline-users"
      style={{ marginTop: "15px", marginBottom: "20px" }}
    >
      <h3 style={{ marginBottom: "15px" }}>Offline Users</h3>
      <ul className="users-list">
        {offlineUsers.map((user: any) => (
          <li
            key={user._id}
            onClick={() => pvHandler(user)}
            style={{ cursor: "pointer", padding: "2px" }}
          >
            <img
              src={`${import.meta.env.VITE_BACKEND_BASE_URL}/${user.profile}`}
              alt="Profile"
              className="avatar"
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span>{user.username}</span>
              <span>
                {user.lastSeen
                  ? ` ${new Date(user.lastSeen).toLocaleString()}`
                  : " (Offline)"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default OfflineUsers;
