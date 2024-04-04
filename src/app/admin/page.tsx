"use client";
import { useSocket } from "@/provider/socket-provider";
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";

const VideoStream = () => {
  const { isConnected, socket } = useSocket(); // Access socket from context
  const webcamRef = useRef(null);
  const [frameData, setFrameData] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (socket) {
      socket.broadcast.on("message", (data: any) => {
        // setFrameData(data);
        setMessage(data);
        console.log("data : " + data);
      });

      // Handle cleanup on unmount
      return () => socket.socket.disconnect();
    }
  }, [socket]);

  const sendMessage = () => {
    console.log(socket);
    // if (!socket) return; // Handle empty message or missing socket
    socket.emit("message", `${message} from ${socket.id}`);
    setMessage("");
    console.log("message sent");
  };

  // Function to display received frame (replace with your custom logic for handling frame data)

  return (
    <div>
      <div>
        <button onClick={sendMessage}>send message</button>
        <div>
          message:
          <input value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        {isConnected ? (
          <p>Connected to server</p>
        ) : (
          <p>Not connected to server</p>
        )}
        <div>
          {/* <Webcam
            audio={false}
            height={720} // Adjust the height as per your requirement
            width={1280} // Adjust the width as per your requirement
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user" }}
            screenshotQuality={1}
            // Set the frame data as the src for the Webcam component
            src={frameData || ""}
          /> */}
        </div>
      </div>
    </div>
  );
};

export default VideoStream;
