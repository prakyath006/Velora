'use server';

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function analyzeGoalSMART(goalTitle: string, thrustArea: string) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      // Fallback robust mock for demo purposes if no API key is set
      await new Promise(r => setTimeout(r, 1500));
      return {
        score: Math.floor(Math.random() * 20) + 70, // 70-90 score
        feedback: `This goal targets ${thrustArea}. It's a good start, but to make it a true SMART goal, ensure you define a specific quantifiable target and a clear deadline. Example: "Increase ${thrustArea.toLowerCase()} by 15% before Q3."`,
        isSmart: false
      };
    }

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: `Analyze the following employee goal for SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound).
      
      Goal: "${goalTitle}"
      Category (Thrust Area): "${thrustArea}"
      
      Return a brief, professional evaluation. Be encouraging but critical. Max 3 sentences.
      If it is not SMART, provide a rewritten 1-sentence example of how to make it SMART.
      
      Output format strictly as JSON:
      {
        "score": (number 0-100 indicating how SMART it currently is),
        "feedback": (your 2-3 sentence feedback and rewritten example),
        "isSmart": (boolean true if score > 85)
      }
      `
    });

    const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, ''));
    return parsed;
  } catch (error) {
    console.error('AI Error:', error);
    return {
      score: 50,
      feedback: "Could not connect to AI assistant. Please review your goal manually to ensure it has a specific target and timeline.",
      isSmart: false
    };
  }
}
