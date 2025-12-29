
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PipelineComponent, DesignError } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeIsometric = async (base64Image: string): Promise<{ components: PipelineComponent[] }> => {
  const model = 'gemini-3-pro-preview';
  const prompt = `Analyze this industrial piping isometric drawing. 
  Identify key components: pipes, valves, flanges, pumps, and instruments.
  Return the results as a JSON list of objects with 'type', 'name', and 'description'.`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          components: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                name: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["type", "name", "description"]
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{"components":[]}');
};

export const detectDesignErrors = async (base64Image: string): Promise<{ errors: DesignError[] }> => {
  const model = 'gemini-3-pro-preview';
  const prompt = `Act as a senior piping design engineer. 
  Examine this isometric drawing for design errors, compliance issues, or safety hazards. 
  Look for: disconnected segments, missing vents/drains, incorrect flow orientations, or missing supports.
  Return a JSON list of errors with 'category' (Critical, Warning, Info), 'description', 'recommendation', and 'confidence' (0-1).`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          errors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                recommendation: { type: Type.STRING },
                confidence: { type: Type.NUMBER }
              },
              required: ["category", "description", "recommendation", "confidence"]
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{"errors":[]}');
};

export const generateUpdatedDrawing = async (base64Image: string, errors: DesignError[]): Promise<string> => {
  // Use gemini-2.5-flash-image for image editing/generation
  const model = 'gemini-2.5-flash-image';
  const errorContext = errors.map(e => `- ${e.description} (Recommended fix: ${e.recommendation})`).join('\n');
  const prompt = `Here is an isometric piping drawing with several design errors.
  ERRORS TO FIX:
  ${errorContext}
  
  Please generate a clean, updated version of this isometric drawing that incorporates all recommended fixes. 
  Keep the same perspective, industrial style, and technical blueprint aesthetic.`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
        { text: prompt }
      ]
    }
  });

  let imageUrl = '';
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }

  if (!imageUrl) throw new Error("Could not generate updated image part.");
  return imageUrl;
};
