"use client";
import { useSocket } from "@/provider/socket-provider";
import { useEffect, useState } from "react";
import { useCallback } from "react";
import peer from "@/utils/peer";
import ReactPlayer from "react-player";
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  Card,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import axios from "axios";
import { SunIcon, ThermometerIcon } from "lucide-react";
import { AdminSettingDrawerDialog } from "@/components/admin-setting";
import { Rings } from "react-loader-spinner";

// let base_url = "http://192.168.234.126:5000";

const VideoStream = () => {
  const { isConnected, socket } = useSocket(); // Access socket from context
  const [message, setMessage] = useState("");
  const [remoteSocketId, setRemoteSocketId] = useState("");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [room, setRoom] = useState("1");

  const [temperature, setTemperature] = useState(72);
  const [humidity, setHumidity] = useState(50);
  const [light, setLight] = useState(false);
  const [ac, setAc] = useState(false);
  const [fanSpeed, setFanSpeed] = useState(0);

  const getSensorData = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/getsensordata`
      );
      setTemperature(response.data.temperature);
      setHumidity(response.data.humidity);
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };
  // axios api to get temperature and humidity
  useEffect(() => {
    // interval to get temperature and humidity every 5 seconds
    const interval = setInterval(() => {
      getSensorData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
    async ({ from, offer }: { from: any; offer: any }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }: { ans: any }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!", remoteStream);
      setRemoteStream(remoteStream[0]);
    });
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
      socket.on("message", (data: any) => {
        setMessage(data);
        console.log("data : " + data);
      });
      socket.on("stream", (data: any) => {
        // Handle video stream data
        console.log("video-stream data : " + data);
      });

      // Handle cleanup on unmount
      return () => socket.disconnect();
    }
  }, [socket]);

  const sendMessage = () => {
    console.log(socket);
    if (!socket || !socket.connected) {
      console.log("socket not connected");
      return;
    }
    // if (!socket) return; // Handle empty message or missing socket
    socket.emit("message", `Test Signal from Admin! ${socket.id}`);
    setMessage("");
    socket.on("error", (error: any) => {
      console.log("error : " + error);
    });
    console.log("message sent");
  };

  const handleToggle = (checked: boolean) => {
    setLight(checked);

    axios
      .get(
        `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/light?status=${
          checked ? "on" : "off"
        }`
      )
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        console.log(error);
      });

    console.log(checked);
  };

  const handleToggleAc = (checked: boolean) => {
    setAc(checked);

    axios
      .get(
        `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/ac?status=${
          checked ? "on" : "off"
        }`
      )
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleFanSpeed = (speed: number) => {
    setFanSpeed(speed);
    axios
      .get(`${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/fan?speed=${speed}`)
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <div>
      <AdminSettingDrawerDialog
        sendMessage={sendMessage}
        connectToSecurEye={handleJoinRoom}
        acceptVideoStream={handleNegoNeeded}
      />
      <div>
        <div className="fixed right-1 top-1">
          {isConnected ? (
            <Rings height={50} color="green" />
          ) : (
            <Rings height={50} color="red" />
          )}
        </div>
        <div>
          {" "}
          <div className="grid w-full mt-16 px-2 m-auto h-screen gap-4 md:gap-8 lg:grid-cols-[300px_1fr]">
            <div className="grid gap-4 md:grid-rows-2">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Living Room</CardTitle>
                    <CardDescription>2 devices</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <SunIcon className="w-6 h-6" />
                        <span className="font-medium">Light</span>
                        <Switch
                          className="ml-auto w-10 h-6"
                          checked={light}
                          onCheckedChange={(checked) =>
                            handleToggle(checked as boolean)
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <ThermometerIcon className="w-6 h-6" />
                        <span className="font-medium">AC</span>
                        <Switch
                          className="ml-auto w-10 h-6"
                          checked={ac}
                          onCheckedChange={(checked: boolean) =>
                            handleToggleAc(checked as boolean)
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Fan Speed Control</CardTitle>
                    <CardDescription>Adjust the Slider</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      <div className="text-4xl font-semibold">72°</div>
                      <Slider
                        max={100}
                        min={0}
                        step={5}
                        defaultValue={[fanSpeed]}
                        onValueCommit={(val) => {
                          setFanSpeed(val[0]);
                          handleFanSpeed(val[0]);
                        }}
                      />{" "}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Temperature</CardTitle>
                    <CardDescription>Adjust the thermostat</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      <div className="text-2xl font-semibold">
                        Temperature: {temperature}
                        <Slider value={[temperature]} className="w-full" />
                      </div>
                      <div className="text-2xl font-semibold">
                        Humidity: {humidity}
                        <Slider value={[humidity]} className="w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="grid gap-4"></div>
            </div>
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Live Video</CardTitle>
                  <CardDescription>Front Door</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video rounded-xl overflow-hidden">
                    {remoteStream && (
                      <>
                        <h1>Remote Stream</h1>
                        <ReactPlayer
                          playing
                          muted
                          height={"100%"}
                          width={"100%"}
                          url={remoteStream}
                        />
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoStream;
