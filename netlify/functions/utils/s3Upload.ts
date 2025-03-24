// import ffmpeg from "../../../config/ffmpeg";
import AWS from "aws-sdk";
import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_NETLIFY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_NETLIFY,
  region: process.env.AWS_REGION_NETLIFY,
});

export const uploadToS3 = async (filePath: string, folder: string, contentType: string): Promise<string> => {
  const fileStream = fs.createReadStream(filePath);
  const fileName = path.basename(filePath);
  
  const params = {
    Bucket: process.env.S3_BUCKET_NAME_NETLIFY!,
    Key: `${folder}/${fileName}`, // Organizing into separate folders
    Body: fileStream,
    ContentType: contentType,
  };

  try {
    const uploadResult = await s3.upload(params).promise();
    return uploadResult.Location;
  } finally {
    fileStream.destroy();
  }
};

export const uploadHLSFolder = async (folderPath: string): Promise<{ m3u8Url: string; tsUrls: string[] }> => {
  const files = fs.readdirSync(folderPath);

  const uploads = files.map(async (file) => {
    const filePath = path.join(folderPath, file);
    let folder = "videos"; // Default folder for .m3u8 and .ts
    let contentType = "video/mp2t";

    if (file.endsWith(".m3u8")) {
      contentType = "application/vnd.apple.mpegurl";
    } else if (file.endsWith(".webp")) {
      folder = "thumbnails"; // Store thumbnails separately
      contentType = "image/webp";
    }

    const s3Url = await uploadToS3(filePath, folder, contentType);
    return { file, s3Url };
  });

  const results = await Promise.all(uploads);

  let m3u8Url = "";
  const tsUrls: string[] = [];

  for (const { file, s3Url } of results) {
    if (file.endsWith(".m3u8")) {
      m3u8Url = s3Url;
    } else if (file.endsWith(".ts")) {
      tsUrls.push(s3Url);
    }
  }

  return { m3u8Url, tsUrls };
};