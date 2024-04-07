"use client";
import { useSocket } from "@/provider/socket-provider";
import { useEffect, useRef, useState } from "react";
import { useCallback } from "react";
import peer from "@/utils/peer";
import ReactPlayer from "react-player";

const VideoStream = () => {
  const { isConnected, socket } = useSocket(); // Access socket from context
  const [remoteSocketId, setRemoteSocketId] = useState("");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [room, setRoom] = useState("1");

  const handleJoinRoom = () => {
    if (socket) {
      console.log("Room Joined");

      socket.emit("room:join", { room });
    }
  };

  const handleUserJoined = useCallback(({ id }: { id: string }) => {
    console.log(`id ${id} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleIncommingCall = useCallback(
    async ({ from, offer }: { from: any; offer: any }) => {
      setRemoteSocketId(from);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }: { from: string; offer: any }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }: { ans: any }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("user:joined", handleUserJoined);
      socket.on("incomming:call", handleIncommingCall);
      socket.on("peer:nego:needed", handleNegoNeedIncomming);
      socket.on("peer:nego:final", handleNegoNeedFinal);

      return () => {
        socket.off("user:joined", handleUserJoined);
        socket.off("incomming:call", handleIncommingCall);
        socket.off("peer:nego:needed", handleNegoNeedIncomming);
        socket.off("peer:nego:final", handleNegoNeedFinal);
      };
    }
  }, [
    socket,
    handleIncommingCall,
    handleUserJoined,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  useEffect(() => {
    if (socket) {
      // Handle cleanup on unmount
      return () => socket.disconnect();
    }
  }, [socket]);

  // Function to display received frame (replace with your custom logic for handling frame data)

  return (
    <div>
      <div>
        <button onClick={handleJoinRoom}>Join Room</button>
        <button onClick={handleNegoNeeded}>Call</button>

        {isConnected ? (
          <p>Connected to server</p>
        ) : (
          <p>Not connected to server</p>
        )}
        <div>
          {remoteStream && (
            <>
              <h1>Remote Stream</h1>
              <ReactPlayer
                playing
                muted
                height="100px"
                width="200px"
                url={remoteStream}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoStream;
