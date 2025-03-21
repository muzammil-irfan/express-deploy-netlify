import express, { Router } from "express";
import serverless from "serverless-http";

const api = express();
const router = Router();

// Define routes
router.get("/hello", (req, res) => {res.send("Hello World!")});
router.get("/status", (req, res) => {res.json({ status: "Running" })});

api.use("/api/", router);

// Export as a Netlify serverless function
export const handler = serverless(api);