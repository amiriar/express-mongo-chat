import { FaCheck, FaCheckDouble } from "react-icons/fa"; // For sent, delivered
import { MdDoneAll } from "react-icons/md"; // For seen

interface MessageStatusProps {
  status: string;
//   status: "sent" | "delivered" | "seen";
}

const MessageStatus: React.FC<MessageStatusProps> = ({ status }) => {
  const renderStatusIcon = () => {
    switch (status) {
      case "sent":
        return <FaCheck size={13} style={{ color: "gray" }} />; // Single gray tick
      case "delivered":
        return <FaCheckDouble size={13} style={{ color: "gray" }} />; // Double gray ticks
      case "seen":
        return <MdDoneAll size={13} style={{ color: "blue" }} />; // Double blue ticks
      default:
        return null;
    }
  };

  return <div>{renderStatusIcon()}</div>;
};

export default MessageStatus;
