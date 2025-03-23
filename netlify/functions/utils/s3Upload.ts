// import ffmpeg from "../../../config/ffmpeg";
import AWS from "aws-sdk";
import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
});

export const uploadToS3 = async (filePath: string, contentType: string): Promise<string> => {
  const fileStream = fs.createReadStream(filePath);
  const params = {
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: `videos/${Date.now()}-${path.basename(filePath)}`,
    Body: fileStream,
    ContentType: contentType,
  };

  const uploadResult = await s3.upload(params).promise();
  return uploadResult.Location;
};

export const uploadHLSFolder = async (folderPath: string): Promise<{ m3u8Url: string; tsUrls: string[] }> => {
  const files = fs.readdirSync(folderPath);
  const tsUrls: string[] = [];

  let m3u8Url = "";

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const contentType = file.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/mp2t";

    const s3Url = await uploadToS3(filePath, contentType);

    if (file.endsWith(".m3u8")) {
      m3u8Url = s3Url;
    } else if (file.endsWith(".ts")) {
      tsUrls.push(s3Url);
    }
  }

  return { m3u8Url, tsUrls };
};
