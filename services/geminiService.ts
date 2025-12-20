
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiUrlResponse } from "../types";

export const generateWorkspaceConfig = async (topic: string): Promise<GeminiUrlResponse> => {
  try {
    // Initialize lazily to avoid top-level module crash when process.env.API_KEY is empty string
    const apiKey = process.env.API_KEY;
    
    // If no API key is present (e.g. during UI testing), throw specific error to trigger fallback
    if (!apiKey) {
      console.warn("Gemini API Key is missing (UI Test Mode)");
      throw new Error("API Key is missing");
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 4 valid, embeddable URLS for a web workspace focused on: "${topic}". 
      Prefer Wikipedia, documentation sites, news aggregators, or tools that are known to allow iframe embedding (avoid major social media main pages or google search results as they block iframes).
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
    // Return a safe default so the app doesn't break
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
