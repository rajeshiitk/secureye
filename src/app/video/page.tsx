"use client";
import React, { useRef, useEffect, useState } from "react";
import { useSocket } from "@/provider/socket-provider"; // Assuming Socket.IO provider

const Page = () => {
  const videoRef = useRef<HTMLVideoElement>(null); // New reference for video element

  const [isPlaying, setIsPlaying] = useState(false);
  const { socket } = useSocket();

  const handlePlay = () => {
    if (socket) {
      setIsPlaying(true);
      console.log("Playing video");
    } else {
      console.error("Socket connection unavailable");
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  useEffect(() => {
    if (isPlaying && socket) {
      const handleFrame = (imgSrc: any) => {
        if (videoRef.current) {
          // Create a Blob object from the base64 encoded image data
          const byteString = atob(
            imgSrc.replace(/^data:image\/(.*;base64,)?/, "")
          ); // Remove data URI prefix
          // const mimeType = imgSrc.match(/data:image\/(.*;)?$/)[1]; // Extract mime type from data URI (if present)
          const arrayBuffer = new ArrayBuffer(byteString.length);
          const intArray = new Uint8Array(arrayBuffer);
          for (let i = 0; i < byteString.length; i++) {
            intArray[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([arrayBuffer], {
            type: "video/webm",
          }); // Default to webm

          // Create a temporary URL for the Blob
          const videoURL = URL.createObjectURL(blob);

          // Set the video element's source to the temporary URL
          videoRef.current.src = videoURL;
          console.log(videoURL);
          // Play the video immediately
          videoRef.current.play();
        }
      };

      socket.on("video-frame", handleFrame);

      return () => socket.off("video-frame", handleFrame);
    }
  }, [isPlaying, socket, videoRef]);

  return (
    <div className="flex-col flex md:flex-row relative h-[calc(100svh)]">
      {/* ... other elements */}
      <button onClick={handlePlay}>Play</button>
      <button onClick={handlePause}>Pause</button>

      {isPlaying && (
        <video
          ref={videoRef}
          controls
          autoPlay
          muted
          width="320"
          height="240"
        /> // Adjust dimensions as needed
      )}
    </div>
  );
};

export default Page;
