import express from "express";
import serverless from "serverless-http";
import router from "./routes";
import dotenv from "dotenv";

dotenv.config();

const api = express();
api.use("/api/", router);

// Export as a Netlify serverless function
export const handler = serverless(api);