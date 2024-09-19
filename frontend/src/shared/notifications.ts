import { Sender } from "../modules/types/types";

function sendNotification(message: string, user: Sender) {
  document.onvisibilitychange = () => {
    if (document.hidden) {
      const notification = new Notification("New message from Amir Chat", {
        // icon: "https://cdn-icons-png.flaticon.com/512/733/733585.png", // change this to user.profile later 
        icon: `${import.meta.env.VITE_BACKEND_BASE_URL}/${user.profile}`, 
        body: `@${user.username}: ${message}`,
      });
      notification.onclick = () =>
        function () {
          window.open(`${import.meta.env.VITE_BACKEND_BASE_URL}/chats`);
        };
    }
  };
}

export default function checkPageStatus(message: string, user: Sender) {
  if (user._id === localStorage.getItem("userId")) {
    if (!("Notification" in window)) {
      alert("This browser does not support system notifications!");
    } else if (Notification.permission === "granted") {
      sendNotification(message, user);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission((permission) => {
        if (permission === "granted") {
          sendNotification(message, user);
        }
      });
    }
  }
}
