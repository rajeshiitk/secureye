"use client";
import { ModeToggle } from "@/components/themeToggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import React, { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    // If 'Open' state is true, open the gate
    if (isPersonDetected) {
      openGate();
    } else {
      closeGate();
    }
  }, [isPersonDetected]);

  useEffect(() => {
    if (Open) {
      const res = Axios.get("http://192.168.255.184/open");
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
          console.log("prediction class :" + prediction.class);
          console.log(isPerson);
        });

        if (isPerson) {
          setIsPersonDetected(true);
          if (!gateOpen) {
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
      runPrediction();
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
