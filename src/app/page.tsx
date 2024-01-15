"use client";
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
        </div>
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 h-full w-full object-contain p-2"
        ></canvas>
      </div>
    </div>
  );
};

export default Page;
