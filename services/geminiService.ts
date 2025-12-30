
import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import { PipelineComponent, DesignError } from "../types";
import { v4 as uuidv4 } from 'uuid';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

interface GeminiError {
  code?: number;
  message?: string;
  status?: string;
}

/**
 * Parse Gemini API error and return user-friendly message
 */
const parseGeminiError = (error: any): string => {
  // Try to extract error details from different error formats
  let apiError: GeminiError | null = null;

  // Format 1: error.error object
  if (error?.error) {
    apiError = error.error;
  }
  // Format 2: Direct error properties
  else if (error?.code || error?.status) {
    apiError = error;
  }
  // Format 3: Nested in response
  else if (error?.response?.error) {
    apiError = error.response.error;
  }

  // If we found an API error, map it to user-friendly message
  if (apiError) {
    const code = apiError.code;
    const status = apiError.status;
    const message = apiError.message || '';

    // Map common error codes to user-friendly messages
    switch (code) {
      case 503:
        return 'The AI service is currently overloaded. Please wait a moment and try again.';

      case 429:
        return 'Too many requests. Please wait a few minutes before trying again.';

      case 500:
      case 502:
      case 504:
        return 'The AI service is temporarily unavailable. Please try again in a few moments.';

      case 400:
        if (message.toLowerCase().includes('image')) {
          return 'The image format is invalid. Please upload a clear PNG or JPG file.';
        }
        return 'Invalid request. Please check your input and try again.';

      case 401:
      case 403:
        return 'API authentication failed. Please check your API key configuration.';

      case 404:
        return 'The requested AI model is not available. Please contact support.';
    }

    // Check status codes
    if (status === 'UNAVAILABLE') {
      return 'The AI service is temporarily unavailable. Please try again shortly.';
    }
    if (status === 'RESOURCE_EXHAUSTED') {
      return 'API quota exceeded. Please wait before making more requests.';
    }
    if (status === 'DEADLINE_EXCEEDED') {
      return 'Request timed out. The image may be too large or complex. Try a smaller image.';
    }

    // If we have a message but no specific code, clean it up
    if (message) {
      // Remove technical jargon
      const cleanMessage = message
        .replace(/\b(candidate|content|parts|inlineData)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanMessage.length > 10 && cleanMessage.length < 150) {
        return cleanMessage;
      }
    }
  }

  // Fallback for unknown errors
  const errorMessage = error?.message || String(error);

  // Check for common network errors
  if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  if (errorMessage.includes('timeout')) {
    return 'Request timed out. Please try again with a smaller image or check your connection.';
  }

  // Last resort - return a generic friendly message
  return 'An unexpected error occurred. Please try again or contact support if the issue persists.';
};

export const analyzeIsometric = async (base64Image: string): Promise<{ components: PipelineComponent[] }> => {
  const model = 'gemini-3-pro-preview';
  const prompt = `Analyze this industrial piping isometric drawing.
  Identify key components: pipes, valves, flanges, pumps, and instruments.
  Return the results as a JSON list of objects with 'type', 'name', and 'description'.`;

  try {
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

    const parsed = JSON.parse(response.text || '{"components":[]}');

    // Generate unique IDs for all AI-generated components using UUID
    const componentsWithIds = parsed.components.map((comp: any) => ({
      ...comp,
      id: uuidv4()
    }));

    console.log('[analyzeIsometric] Generated component UUIDs:', componentsWithIds.map(c => c.id));

    return { components: componentsWithIds };

  } catch (error) {
    // Parse and throw user-friendly error
    const userMessage = parseGeminiError(error);
    throw new Error(userMessage);
  }
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

  try {
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

    const parsed = JSON.parse(response.text || '{"errors":[]}');

    // Generate unique IDs for all AI-generated errors using UUID
    const errorsWithIds = parsed.errors.map((error: any) => {
      const newId = uuidv4();
      console.log('[detectDesignErrors] Generated UUID for error:', newId, '-', error.description?.substring(0, 40));
      return {
        ...error,
        id: newId
      };
    });

    console.log('[detectDesignErrors] All error IDs:', errorsWithIds.map(e => ({ id: e.id, desc: e.description?.substring(0, 30) })));

    return { errors: errorsWithIds };

  } catch (error) {
    // Parse and throw user-friendly error
    const userMessage = parseGeminiError(error);
    throw new Error(userMessage);
  }
};

export const generateUpdatedDrawing = async (base64Image: string, errors: DesignError[]): Promise<string> => {
  // Use gemini-2.5-flash-image for image editing/generation
  const model = 'gemini-2.5-flash-image';

  console.log('=== [generateUpdatedDrawing] FUNCTION CALLED ===');
  console.log('[generateUpdatedDrawing] Errors array length:', errors.length);
  console.log('[generateUpdatedDrawing] Errors received:', JSON.stringify(errors.map(e => ({
    id: e.id,
    description: e.description,
    recommendation: e.recommendation,
    category: e.category
  })), null, 2));

  const errorContext = errors.map(e => `- ${e.description} (Recommended fix: ${e.recommendation})`).join('\n');

  console.log('[generateUpdatedDrawing] Error context built:');
  console.log(errorContext);
  console.log('[generateUpdatedDrawing] Error context length:', errorContext.length);
  console.log('[generateUpdatedDrawing] Error context is empty:', errorContext.length === 0);

  const prompt = `Here is an isometric piping drawing with several design errors.
  ERRORS TO FIX:
  ${errorContext}

  IMPORTANT: You MUST generate an updated image of the drawing with the corrections applied.
  Do NOT provide text explanations - generate the corrected drawing image.
  Keep the same perspective, industrial style, and technical blueprint aesthetic.`;

  console.log('[generateUpdatedDrawing] ===== FULL PROMPT START =====');
  console.log(prompt);
  console.log('[generateUpdatedDrawing] ===== FULL PROMPT END =====');
  console.log('[generateUpdatedDrawing] Prompt length:', prompt.length);

  try {
    console.log('[generateUpdatedDrawing] Sending request to Gemini API with model:', model);
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
          { text: prompt }
        ]
      }
    });

    console.log('[generateUpdatedDrawing] ===== API RESPONSE RECEIVED =====');
    console.log('[generateUpdatedDrawing] Full response:', JSON.stringify(response, null, 2));

    // Validate response structure
    if (!response.candidates || response.candidates.length === 0) {
      console.error('[generateUpdatedDrawing] No candidates in response');
      throw new Error("Unable to generate corrected drawing. Please try again.");
    }

    const candidate = response.candidates[0];
    console.log('[generateUpdatedDrawing] Candidate content:', JSON.stringify(candidate.content, null, 2));

    if (!candidate.content || !candidate.content.parts) {
      console.error('[generateUpdatedDrawing] Invalid candidate content structure');
      throw new Error("Invalid response from AI. Please try again.");
    }

    // Check for image data
    let imageUrl = '';
    for (const part of candidate.content.parts) {
      console.log('[generateUpdatedDrawing] Checking part:', {
        hasInlineData: !!part.inlineData,
        hasText: !!part.text,
        textPreview: part.text?.substring(0, 100)
      });

      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        console.log('[generateUpdatedDrawing] Image data found, length:', part.inlineData.data.length);
        break;
      }
    }

    if (!imageUrl) {
      // Check if response contains text instead of image
      const textParts = candidate.content.parts.filter(p => p.text);
      if (textParts.length > 0) {
        console.error('[generateUpdatedDrawing] AI returned text instead of image:', textParts.map(p => p.text));
        throw new Error("AI returned explanation instead of image. Try simplifying the drawing.");
      }
      console.error('[generateUpdatedDrawing] No image data in response');
      throw new Error("Could not generate corrected drawing. Please try again.");
    }

    console.log('[generateUpdatedDrawing] Successfully extracted image URL');
    return imageUrl;

  } catch (error) {
    // If error is already a user-friendly Error from validation, rethrow it
    if (error instanceof Error && (error.message.startsWith('Unable to') || error.message.startsWith('AI returned') || error.message.startsWith('Could not') || error.message.startsWith('Invalid response'))) {
      throw error;
    }
    // Otherwise parse API error
    const userMessage = parseGeminiError(error);
    throw new Error(userMessage);
  }
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

  console.log('=== [generateAnnotatedDrawing] FUNCTION CALLED ===');
  console.log('[generateAnnotatedDrawing] Errors array length:', errors.length);
  console.log('[generateAnnotatedDrawing] Errors received:', JSON.stringify(errors.map(e => ({
    id: e.id,
    description: e.description,
    category: e.category,
    location: e.location,
    affectedComponents: e.affectedComponents
  })), null, 2));

  // Build annotation instructions with color coding
  const annotations = errors.map((e, index) => {
    const color = e.category === 'Critical' ? 'red' :
                  e.category === 'Warning' ? 'orange' : 'blue';
    const location = e.location || e.affectedComponents?.join(', ') || e.description;
    return `${index + 1}. Add ${color} marker at: ${location}`;
  }).join('\n');

  console.log('[generateAnnotatedDrawing] Annotations built:');
  console.log(annotations);
  console.log('[generateAnnotatedDrawing] Annotations length:', annotations.length);

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

IMPORTANT: You MUST return an annotated image. Do NOT provide text explanations.
Return the annotated drawing with all markers clearly visible.`;

  console.log('[generateAnnotatedDrawing] ===== FULL PROMPT START =====');
  console.log(prompt);
  console.log('[generateAnnotatedDrawing] ===== FULL PROMPT END =====');

  try {
    console.log('[generateAnnotatedDrawing] Sending request to Gemini API with model:', model);
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
          { text: prompt }
        ]
      }
    });

    console.log('[generateAnnotatedDrawing] ===== API RESPONSE RECEIVED =====');
    console.log('[generateAnnotatedDrawing] Response candidates:', response.candidates?.length || 0);

    // Validate response structure
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("Unable to generate annotated drawing. Please try again.");
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts) {
      throw new Error("Invalid response from AI. Please try again.");
    }

    // Extract image from response
    let imageUrl = '';
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      // Check if response contains text instead of image
      const textParts = candidate.content.parts.filter(p => p.text);
      if (textParts.length > 0) {
        throw new Error("AI returned explanation instead of image. Try simplifying the drawing.");
      }
      throw new Error("Could not generate annotated drawing. Please try again.");
    }

    return imageUrl;

  } catch (error) {
    // If error is already a user-friendly Error from validation, rethrow it
    if (error instanceof Error && (error.message.startsWith('Unable to') || error.message.startsWith('AI returned') || error.message.startsWith('Could not') || error.message.startsWith('Invalid response'))) {
      throw error;
    }
    // Otherwise parse API error
    const userMessage = parseGeminiError(error);
    throw new Error(userMessage);
  }
};
