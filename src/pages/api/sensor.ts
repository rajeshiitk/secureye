import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  message: string;
};

declare global {
  // eslint-disable-next-line no-unused-vars, no-var
  var temperatureGlobal: undefined | string;
  var humidityGlobal: undefined | string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { temperature, humidity } = req.query;
  global.temperatureGlobal = temperature as string;
  global.humidityGlobal = humidity as string;

  res.status(200).json({ message: "data  saved!" });
}
