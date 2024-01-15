"use client";
import { ModeToggle } from "@/components/themeToggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import React, { use, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import {
  Camera,
  FlipHorizontal,
  SwitchCamera,
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
  });

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
      // console.log(predictions);
      resizeCanvas(canvasRef, webcamRef);
      drawOnCanvas(mirrored, predictions, canvasRef.current?.getContext("2d"));
    }
  }

  useEffect(() => {
    interval = setInterval(() => {
      runPrediction();
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [model, mirrored]);

  return (
    <div className="flex h-screen">
      <div className="relative">
        <div className="relative h-screen w-full">
          <Webcam
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
      <div className="flex flex-row flex-1">
        <div className="border-primary/5 border-2 max-w-xs  flex flex-col gap-2 justify-between shadow-md rounded-md p-4">
          <div className="flex flex-col gap-2">
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
            <Separator className="my-2" />
          </div>
          <div className="flex flex-col gap-2">
            <Separator className="my-2" />
            <Button
              variant="outline"
              size="icon"
              onClick={userPromptScreenshot}
            >
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
              {autoRecord ? (
                <Rings color="white" height={45} />
              ) : (
                <SwitchCamera />
              )}
            </Button>
            <Separator className="my-2" />
          </div>

          <div className="flex flex-col gap-2">
            <Separator className="my-2" />
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
      </div>
      {isLoading && <Loader />}
    </div>
  );

  // handle functions

  function userPromptScreenshot() {
    const imageSrc = webcamRef.current?.getScreenshot();
    console.log(imageSrc);
  }

  function userPromptRecord() {
    if (!webcamRef.current) {
      toast("Camera is not found. Please refresh.");
    }

    if (mediaRecorderRef.current?.state == "recording") {
      mediaRecorderRef.current.requestData();
      clearTimeout(stopTimeout);
      mediaRecorderRef.current.stop();
      toast("Recording saved to downloads");
    } else {
      startRecording(false);
    }
  }

  function startRecording(doBeep: boolean) {
    if (webcamRef.current && mediaRecorderRef.current?.state !== "recording") {
      mediaRecorderRef.current?.start();
      doBeep && beep(volume);

      stopTimeout = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.requestData();
          mediaRecorderRef.current.stop();
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
