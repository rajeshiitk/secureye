"use client";
import { ModeToggle } from "@/components/themeToggle";
import { Separator } from "@/components/ui/separator";
import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

interface Props {}

const Page = (props: Props) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mirrored, setMirrored] = useState(true);
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
            <Separator />
          </div>
          <div className="flex flex-col gap-2">
            <Separator />
            <Separator />
          </div>

          <div className="flex flex-col gap-2">
            <Separator />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
