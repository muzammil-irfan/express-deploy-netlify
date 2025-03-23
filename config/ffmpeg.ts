import ffmpeg from "fluent-ffmpeg";
import path from "path";

const ffmpegPath = path.join(process.cwd(), "bin", "ffmpeg");

console.log("Using FFmpeg at:", ffmpegPath);

ffmpeg.setFfmpegPath(ffmpegPath);

export default ffmpeg;
