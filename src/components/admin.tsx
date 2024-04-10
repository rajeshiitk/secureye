"use client";
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  Card,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";
import axios from "axios";

let base_url = "http://192.168.234.126:5000";

export function Admin() {
  const [temperature, setTemperature] = useState(72);
  const [humidity, setHumidity] = useState(50);
  const [light, setLight] = useState(false);
  // axios api to get temperature and humidity
  useEffect(() => {
    axios
      .get(`${base_url}/getsensordata`)
      .then((response) => {
        setTemperature(response.data.temperature);
        setHumidity(response.data.humidity);
        console.log(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  return (
    <div className="grid w-full  h-screen gap-4 md:gap-8 lg:grid-cols-[300px_1fr]">
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
                    onCheckedChange={(checked: boolean) => {
                      setLight(checked);

                      axios
                        .get(
                          `${base_url}/light?status=${checked ? "on" : "off"}`
                        )
                        .then((response) => {
                          console.log(response.data);
                        })
                        .catch((error) => {
                          console.log(error);
                        });

                      console.log(checked);
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <ThermometerIcon className="w-6 h-6" />
                  <span className="font-medium">AC</span>
                  <Switch className="ml-auto w-10 h-6" />
                </div>
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
                <div className="text-4xl font-semibold">72°</div>
                <Slider value={[temperature]} className="w-full" />
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
                </div>
                <div className="text-2xl font-semibold">
                  Humidity: {humidity}
                </div>
                <Slider value={[temperature]} className="w-full" />
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
              <span className="w-full object-cover rounded-md bg-gray-100 dark:bg-gray-800" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// @ts-ignore
function SunIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

// @ts-ignore
function ThermometerIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
    </svg>
  );
}

// @ts-ignore
