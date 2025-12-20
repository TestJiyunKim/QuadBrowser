
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiUrlResponse } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateWorkspaceConfig = async (topic: string): Promise<GeminiUrlResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 4 valid, embeddable URLS for a web workspace focused on: "${topic}". 
      Prefer Wikipedia, documentation sites, news aggregators, or tools that are known to allow iframe embedding.
      Return a JSON object with a workspace name and the list of 4 URLs.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            workspaceName: { type: Type.STRING },
            urls: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of exactly 4 valid URLs"
            }
          },
          required: ["workspaceName", "urls"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as GeminiUrlResponse;
    }
    throw new Error("Empty response");
  } catch (error) {
    console.error("AI Config Error:", error);
    return {
      workspaceName: "Default Workspace",
      urls: [
        "https://www.wikipedia.org",
        "https://www.bing.com",
        "https://news.ycombinator.com",
        "https://www.w3schools.com"
      ]
    };
  }
};
