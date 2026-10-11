import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { questionContext, history } = body

  // We need GOOGLE_API_KEY env var
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reply: "I'm sorry, my AI backend is not configured correctly (missing API key)." });
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const systemPrompt = `You are an expert, encouraging AI Study Tutor for a student preparing for competitive exams like JEE, GATE, or CAT.
You are helping the student with a specific question.
Here is the context of the question they attempted:
- Question: ${questionContext.question_text}
- Correct Answer (Explanation): ${questionContext.detailed_solution || 'Not provided'}
- Question Type: ${questionContext.question_type}
- Positive Marks: ${questionContext.positive_marks}

Your goal is to guide the student to understand the concept. 
DO NOT just give the answer away if they don't know it. Instead, give them a hint, ask a probing question, and gently correct their misconceptions. Use markdown formatting to make math and formulas readable. Keep your answers concise, ideally 1-3 short paragraphs. Be extremely encouraging.`;

    // Convert history for genai SDK
    const contents = [];
    // We add the system prompt as the first message or configure it in instructions (if model supports it)
    
    // Convert history: 
    // user -> user, model -> model
    for (const msg of history) {
      contents.push({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    return NextResponse.json({ reply: response.text })
  } catch (error) {
    console.error("AI Tutor error:", error);
    return NextResponse.json({ reply: "Sorry, I am having trouble connecting to my brain right now. Try again later!" })
  }
}
