// import ffmpeg from "../../../config/ffmpeg";
// import fs from "fs-extra";
import supabase from "../../../config/supabase";

export const METADATA_FILE = "data/metadata.json";

export interface Metadata {
  id: string; // Unique ID for reference
  title: string;
  description?: string;
  timestamp: number;
  m3u8url: string;
  thumbnailurl: string;
  segmenturls: string[];
}

export const saveMetadata = async (data: Metadata) => {
  try {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid metadata format. Expected an object.");
    }

    const { error } = await supabase.from("metadata").insert([data]);

    if (error) {
      console.error("Error saving metadata:", error);
      throw error;
    }

    console.log("Metadata saved successfully");
  } catch (error) {
    console.error("Error:", error);
  }
};