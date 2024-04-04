export const config = {
  api: {
    bodyParser: false, // Disable body parsing for options requests
  },
};

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Replace with your allowed origin
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "*"); // Adjust allowed headers if needed
  res.status(200).json({ message: "CORS preflight request handled" });
}
