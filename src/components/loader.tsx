import React from "react";
import { Rings } from "react-loader-spinner";

interface Props {}

export const Loader = (props: Props) => {
  return (
    <div className="z-50 absolute w-full h-full flex flex-col md:flex-row justify-center items-center bg-primary-foreground text-center">
      🚀 Stay Tight! Our AI 🤖 is Warming Up for Action...
      <Rings height={100} color="red" />
    </div>
  );
};
