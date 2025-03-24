import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { Metadata } from "../netlify/functions/utils/saveMetadata";

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getMetadata = async (): Promise<Metadata[]> => {
    try {
      const { data, error } = await supabase.from("metadata").select("*");
  
      if (error) {
        console.error("Error fetching metadata:", error);
        throw error;
      }
  
      return data || [];
    } catch (error) {
      console.error("Error:", error);
      return [];
    }
  };
// // Define TypeScript interface
// interface Metadata {
//   id: string;
//   title: string;
//   description?: string;
//   timestamp: number;
//   m3u8Url: string;
//   thumbnailUrl: string;
//   segmentUrls: string[];
// }

// // Netlify function handler
// export const handler: Handler = async (event) => {
//   try {
//     if (event.httpMethod === "POST") {
//       const body: Metadata = JSON.parse(event.body || "{}");
//       const { data, error } = await supabase.from("metadata").insert([body]);

//       if (error) throw error;
//       return { statusCode: 200, body: JSON.stringify(data) };
//     }

//     // GET request - Fetch metadata
//     const { data, error } = await supabase.from("metadata").select("*");
//     if (error) throw error;

//     return { statusCode: 200, body: JSON.stringify(data) };
//   } catch (error) {
//     return { statusCode: 500, body: JSON.stringify({ error: (error as Error).message }) };
//   }
// };

export default supabase;