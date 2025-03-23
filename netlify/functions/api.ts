import express, { Request, Response, Router } from "express";
import serverless from "serverless-http";
// import multer from "multer";
// import AWS from "aws-sdk";
import router from "./routes";
import dotenv from "dotenv";

dotenv.config();

const api = express();
// const router = Router();
// const upload = multer({ storage: multer.memoryStorage() });
// const upload = multer({ dest: "uploads/" });

// interface MulterRequest extends Request {
//   file?: Express.Multer.File; // Correctly use Express.Multer.File
// }
// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

api.use("/api/", router);

// Export as a Netlify serverless function
export const handler = serverless(api);