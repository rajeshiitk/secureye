"use client";
import { ModeToggle } from "@/components/themeToggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import {
  Camera,
  Cctv,
  FlipHorizontal,
  SwitchCameraIcon,
  Video,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { Rings } from "react-loader-spinner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { beep } from "@/utils/audio";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-cpu";
import { Loader } from "@/components/loader";
import { drawOnCanvas } from "@/utils/drawOnCanvas";
import { formatDate } from "@/utils/formatDate";
import { base64toBlob } from "@/utils/base64ToBlob";
import Axios from "axios";
import { useSocket } from "@/provider/socket-provider";
import peer from "@/utils/peer";
interface Props {}
let interval: NodeJS.Timeout;
let stopTimeout: NodeJS.Timeout;

const Page = (props: Props) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [mirrored, setMirrored] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [autoRecord, setAutoRecord] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.7);
  const [model, setModel] = useState<cocoSsd.ObjectDetection>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [camera, setCamera] = useState<"user" | "environment">("user");
  const [Open, setOpen] = useState<boolean>(false);
  const [isPersonDetected, setIsPersonDetected] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [enableNodeMCU, setEnableNodeMCU] = useState(false);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteSocketId, setRemoteSocketId] = useState<string | null>();
  const [room, setRoom] = useState<string>("1");
  let noPersonTimeout: NodeJS.Timeout;

  const videoConstraints = {
    facingMode: camera === "user" ? "user" : { exact: "environment" },
  };

  const openGate = async () => {
    try {
      await Axios.get(`${process.env.NEXT_PUBLIC_NODEMCU_URL}/open`);
      setGateOpen(true);
    } catch (error) {
      console.error("Error opening gate:", error);
    }
  };

  const closeGate = async () => {
    try {
      await Axios.get(`${process.env.NEXT_PUBLIC_NODEMCU_URL}/close`);
      setGateOpen(false);
    } catch (error) {
      console.error("Error closing gate:", error);
    }
  };

  const { socket } = useSocket();

  const handleUserJoined = useCallback(({ id }: { id: string }) => {
    console.log(`id ${id} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
    console.log("Call User");
    console.log("Offer", offer);
  }, [remoteSocketId, socket]);

  const sendStreams = useCallback(() => {
    console.log("Sending Streams");
    if (myStream) {
      for (const track of myStream.getTracks()) {
        peer.peer.addTrack(track, myStream);
      }
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleJoinRoom = () => {
    if (socket) {
      console.log("Room Joined");

      socket.emit("room:join", { room });
    }
  };

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
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("user:joined", handleUserJoined);
      socket.on("call:accepted", handleCallAccepted);
      socket.on("peer:nego:needed", handleNegoNeedIncomming);
      socket.on("peer:nego:final", handleNegoNeedFinal);

      return () => {
        socket.off("user:joined", handleUserJoined);
        socket.off("call:accepted", handleCallAccepted);
        socket.off("peer:nego:needed", handleNegoNeedIncomming);
        socket.off("peer:nego:final", handleNegoNeedFinal);
      };
    }
  }, [
    socket,
    handleCallAccepted,
    handleUserJoined,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  useEffect(() => {
    if (socket) {
      socket.on("message", (data: any) => {
        console.log("Received message:", data);
      });
      socket.on("stream", (data: any) => {
        // Handle video stream data
        console.log("video-stream data : " + data);
      });
      return () => {
        socket.off("message", () => {
          console.log("message off");
        });
        socket.off("stream", () => {
          console.log("stream off");
        });
      };
    }
  }, [socket]);

  useEffect(() => {
    // If 'Open' state is true, open the gate
    if (enableNodeMCU) {
      if (isPersonDetected) {
        openGate();
      } else {
        closeGate();
      }
    }
  }, [isPersonDetected]);

  useEffect(() => {
    if (Open && enableNodeMCU) {
      const res = Axios.get(`${process.env.NEXT_PUBLIC_NODEMCU_URL}/close`);
      console.log(res);
      setTimeout(() => {
        closeGate();
      }, 3000);
    }
  }, [Open]);

  const toggleCamera = () => {
    if (camera === "user") {
      setCamera("environment");
    } else {
      setCamera("user");
    }
  };

  useEffect(() => {
    if (webcamRef && webcamRef.current && webcamRef.current?.video) {
      const stream = (webcamRef.current.video as any).captureStream();
      if (stream) {
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            const recordedBlob = new Blob([e.data], { type: "video" });
            const videoURL = URL.createObjectURL(recordedBlob);

            const a = document.createElement("a");
            a.href = videoURL;
            a.download = `${formatDate(new Date())}.webm`;
            a.click();
          }
        };
        mediaRecorderRef.current.onstart = (e) => {
          setIsRecording(true);
        };
        mediaRecorderRef.current.onstop = (e) => {
          setIsRecording(false);
        };
      }
    }
  }, [webcamRef]);
  // init model
  useEffect(() => {
    setIsLoading(true);
    initModel();
  }, []);

  useEffect(() => {
    if (model) {
      setIsLoading(false);
    }
  }, [model]);

  // load model
  async function initModel() {
    const loadedModel: cocoSsd.ObjectDetection = await cocoSsd.load({
      base: "lite_mobilenet_v2",
    });
    setModel(loadedModel);
  }

  // run prediction
  async function runPrediction() {
    if (
      model &&
      webcamRef.current &&
      webcamRef.current?.video &&
      webcamRef.current?.video.readyState === 4
    ) {
      const predictions: cocoSsd.DetectedObject[] = await model.detect(
        webcamRef.current?.video
      );
      resizeCanvas(canvasRef, webcamRef);
      drawOnCanvas(mirrored, predictions, canvasRef.current?.getContext("2d"));
      let isPerson: boolean = false;
      if (predictions.length > 0) {
        predictions.forEach((prediction) => {
          isPerson = prediction.class === "person";
          // console.log("prediction class :" + prediction.class);
          // console.log(isPerson);
        });

        if (isPerson) {
          setIsPersonDetected(true);
          if (!gateOpen && enableNodeMCU) {
            openGate();
          }
          // Restart the timeout if a person is detected
          clearTimeout(noPersonTimeout);
          noPersonTimeout = setTimeout(closeGate, 2000);
        }

        // if (isPerson) {
        //   setOpen(true);
        // }
        if (isPerson && autoRecord) {
          startRecording(true);
        }
      }
    }
  }

  useEffect(() => {
    interval = setInterval(() => {
      // runPrediction();
    }, 500);
    return () => {
      clearInterval(interval);
    };
  }, [model, mirrored, webcamRef, autoRecord, camera]);

  return (
    <div className="flex-col flex md:flex-row relative h-[calc(100svh)]">
      <div className="relative h-[calc(100svh)] w-full">
        <div className="relative h-[calc(100svh)] w-full">
          <Webcam
            videoConstraints={videoConstraints}
            ref={webcamRef}
            mirrored={mirrored}
            className="h-full w-full object-contain p-2"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 h-full w-full object-contain p-2"
          ></canvas>
        </div>
      </div>
      {/* right side bar */}
      <div className="border-primary/5  fixed bottom-0 w-full md:w-fit md:relative border-2 md:max-w-xs flex flex-row  md:flex-col gap-2 justify-between shadow-md rounded-md p-4">
        <div className="flex flex-row md:flex-col gap-2">
          <ModeToggle />
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setMirrored((prev) => !prev);
            }}
          >
            <FlipHorizontal />
          </Button>
          <Separator className="hidden md:block md:my-2" />
        </div>
        <div className="flex flex-row md:flex-col gap-2">
          <Separator className="hidden md:block md:my-2" />
          <Button variant="outline" size="icon" onClick={toggleCamera}>
            <SwitchCameraIcon />
          </Button>
          <Button variant="outline" size="icon" onClick={userPromptScreenshot}>
            <Camera />
          </Button>
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={userPromptRecord}
          >
            <Video />
          </Button>
          <Button
            variant={autoRecord ? "destructive" : "outline"}
            size="icon"
            onClick={toggleAutoRecord}
          >
            {autoRecord ? <Rings color="white" height={45} /> : <Cctv />}
          </Button>
          <Separator className="hidden md:block md:my-2" />
        </div>

        <div className="flex flex-row md:flex-col gap-2">
          <Separator className="hidden md:block md:my-2" />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Volume2 />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Slider
                max={1}
                min={0}
                step={0.1}
                defaultValue={[volume]}
                onValueCommit={(val) => {
                  setVolume(val[0]);
                  beep(val[0]);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {isLoading && <Loader />}
      <div>
        <button onClick={handleCallUser}>Send Stream</button>
        <button onClick={handleJoinRoom}>Join Room</button>
        {remoteSocketId && <p>Remote Socket Id: {remoteSocketId}</p>}
        {room && <p>Room: {room}</p>}
        {socket ? <p>Connected to server</p> : <p>Not connected to server</p>}
      </div>
    </div>
  );

  // handle function

  function userPromptScreenshot() {
    // take picture
    if (!webcamRef.current) {
      toast("Camera not found. Please refresh");
    } else {
      const imgSrc = webcamRef.current.getScreenshot();
      console.log(imgSrc);
      const blob = base64toBlob(imgSrc);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${formatDate(new Date())}.png`;
      a.click();
    }
    // save it to downloads
  }
  function userPromptRecord() {
    if (!webcamRef.current) {
      toast("Camera is not found. Please refresh.");
    }

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      toast("Recording saved to downloads");
      clearTimeout(stopTimeout);
    } else {
      startRecording(false);
    }
  }

  function startRecording(doBeep: boolean) {
    if (webcamRef.current && mediaRecorderRef.current?.state !== "recording") {
      mediaRecorderRef.current?.start();
      toast("Recording started");
      doBeep && beep(volume);

      stopTimeout = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
          toast("Recording saved to downloads");
        }
      }, 30000);
    }
  }
  function toggleAutoRecord() {
    if (autoRecord) {
      setAutoRecord(false);
      toast("Auto Record disabled");
    } else {
      setAutoRecord(true);
      toast("Auto Record enabled");
    }
  }
};

export default Page;

function resizeCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  webcamRef: React.RefObject<Webcam>
) {
  const canvas = canvasRef.current;
  const webcam = webcamRef.current?.video;
  if (canvas && webcam) {
    canvas.width = webcam.videoWidth;
    canvas.height = webcam.videoHeight;
  }
}
