import React from "react";
import { Rings } from "react-loader-spinner";

interface Props {}

export const Loader = (props: Props) => {
  return (
    <div className="z-50 absolute w-full h-full flex justify-center items-center bg-primary-foreground">
      Stay Tight our ML model is cooking up something for you 🤖{" "}
      <Rings height={50} color="red" />
    </div>
  );
};
