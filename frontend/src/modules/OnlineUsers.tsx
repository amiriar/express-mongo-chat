import { IUser, Sender } from "./types/types";

interface OnlineUsersProps {
  onlineUsers: IUser[];
  pvHandler: (user: IUser) => void;
  sender: Sender | null;
}

function OnlineUsers({ onlineUsers, pvHandler, sender }: OnlineUsersProps) {
  return (
    <ul className="users-list">
      {onlineUsers?.map((user) => (
        <li
          key={user._id}
          onClick={() => pvHandler(user)}
          style={{ cursor: "pointer", padding: "2px" }}
        >
          <img
            src={
              user._id === sender?._id
                ? `${import.meta.env.VITE_BACKEND_BASE_URL}/public/static/savedMessages/saved-messages.jpg`
                : `${import.meta.env.VITE_BACKEND_BASE_URL}/${user.profile}`
            }
            alt="Profile"
            className="avatar"
          />

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span>
              {user._id === sender?._id ? (
                "Saved Messages"
              ) : (
                <span>{user.username}</span>
              )}
            </span>
            <span>(Online)</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default OnlineUsers;
