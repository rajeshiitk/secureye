"use client";
import { ModeToggle } from "@/components/themeToggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import React, { useEffect, useRef, useState } from "react";
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
interface Props {}
let interval: NodeJS.Timeout;

const Page = (props: Props) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mirrored, setMirrored] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [autoRecord, setAutoRecord] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.7);
  const [model, setModel] = useState<cocoSsd.ObjectDetection>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
      const predictions = await model.detect(webcamRef.current?.video);
      console.log(predictions);
    }
  }

  useEffect(() => {
    interval = setInterval(() => {
      runPrediction();
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [model]);

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
    // check if recording
    // if recording stop recording
    // else start recording
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
