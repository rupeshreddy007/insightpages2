import dotenv from "dotenv";
import { ChatGroq } from "@langchain/groq";

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.warn("⚠️ GROQ_API_KEY is not set in .env");
}

export const chatModel = new ChatGroq({
  model: "llama-3.3-70b-versatile", // or "llama-3.1-8b-instant" if you prefer
  temperature: 0.2,
  apiKey: process.env.GROQ_API_KEY,
});
