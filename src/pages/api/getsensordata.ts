import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  temperature: string;
  humidity: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  console.log(
    `Temperature Global: ${global.temperatureGlobal}, Humidity Global: ${global.humidityGlobal}`
  );
  res.status(200).json({
    temperature: global.temperatureGlobal || "0",
    humidity: global.humidityGlobal || "0",
  });
}
