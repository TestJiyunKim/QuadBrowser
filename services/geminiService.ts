
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiUrlResponse } from "../types";

// Always use the recommended initialization with named parameter and direct process.env usage
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateWorkspaceConfig = async (topic: string): Promise<GeminiUrlResponse> => {
  try {
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

    // Access the generated text using the .text property as a string
    if (response.text) {
      return JSON.parse(response.text) as GeminiUrlResponse;
    }
    throw new Error("No response from AI");
  } catch (error) {
    console.error("Error generating workspace:", error);
    // Fallback if AI fails
    return {
      workspaceName: "Error / Default",
      urls: [
        "https://www.wikipedia.org",
        "https://example.com",
        "https://bing.com",
        "https://www.w3.org"
      ]
    };
  }
};
