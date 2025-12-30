
import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
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

  IMPORTANT: For each error you detect, provide:
  - category: (Critical, Warning, Info)
  - description: What the error is
  - recommendation: How to fix it
  - confidence: (0-1) certainty score
  - affectedComponents: Array of specific equipment tags, line numbers, or component IDs visible in the drawing (e.g., ["P-101A", "V-100", "2-CW-101"])
  - location: Human-readable location description (e.g., "Pump P-101A suction line", "Heat exchanger E-101 inlet", "Line 2-CW-101 near valve")
  - detectionReason: Brief explanation of how/why you detected this issue (e.g., "ASME BPVC requires relief valve on pressurized vessels", "API 610 mandates suction isolation for centrifugal pumps")

  Return JSON with an 'errors' array containing these fields.`;

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
                confidence: { type: Type.NUMBER },
                affectedComponents: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                location: { type: Type.STRING },
                detectionReason: { type: Type.STRING }
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

export const initializeChatSession = (
  components: PipelineComponent[],
  errors: DesignError[]
): Chat => {
  const componentsSummary = components.map(c =>
    `${c.name} (${c.type}): ${c.description}`
  ).join('\n');

  const errorsSummary = errors.map(e => {
    let summary = `${e.category}: ${e.description}\n  Fix: ${e.recommendation}`;
    if (e.affectedComponents?.length) {
      summary += `\n  Components: ${e.affectedComponents.join(', ')}`;
    }
    if (e.location) {
      summary += `\n  Location: ${e.location}`;
    }
    if (e.detectionReason) {
      summary += `\n  Reasoning: ${e.detectionReason}`;
    }
    return summary;
  }).join('\n\n');

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are a Senior Piping Engineering Consultant for the IsoGuard AI platform.
      The user has just completed an automated audit of an isometric drawing.

      CONTEXT:
      Detected Components:
      ${componentsSummary}

      Identified Design Issues:
      ${errorsSummary}

      Goal: Answer technical questions about the drawing, explain design standards (like ASME B31.3), and help the user understand the AI's recommendations. Be precise, professional, and helpful.`,
    },
  });
};

export const generateAnnotatedDrawing = async (
  base64Image: string,
  errors: DesignError[]
): Promise<string> => {
  const model = 'gemini-2.5-flash-image';

  // Build annotation instructions with color coding
  const annotations = errors.map((e, index) => {
    const color = e.category === 'Critical' ? 'red' :
                  e.category === 'Warning' ? 'orange' : 'blue';
    const location = e.location || e.affectedComponents?.join(', ') || e.description;
    return `${index + 1}. Add ${color} marker at: ${location}`;
  }).join('\n');

  const prompt = `You are annotating an industrial piping isometric drawing to highlight design issues.

ORIGINAL DRAWING: Preserve the drawing exactly as-is. Do not modify or correct anything.

ANNOTATIONS TO ADD:
${annotations}

VISUAL STYLE:
- Use semi-transparent colored circles/highlights (red for critical, orange for warnings, blue for info)
- Add clear numbered labels (1, 2, 3...) next to each marker
- Use arrows pointing to the exact location if needed
- Keep annotations clear but not overwhelming
- Maintain technical drawing readability

Return the annotated drawing with all markers clearly visible.`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
        { text: prompt }
      ]
    }
  });

  // Extract image from response
  let imageUrl = '';
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }

  if (!imageUrl) throw new Error("Could not generate annotated image");
  return imageUrl;
};
