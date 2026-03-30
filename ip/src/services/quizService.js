import { chatModel } from "../llm/client.js";
import { getNotebookContextText } from "./utils.js";

export async function generateQuiz(notebookId, count = 10) {
  const contextText = await getNotebookContextText(notebookId, 25);

  const prompt = `
Create a quiz of ${count} questions based on the context.
Format as JSON:
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "explanation": "..."
  }
]

Context:
${contextText}
`;

  const res = await chatModel.invoke([{ role: "user", content: prompt }]);

  try {
    const text = res.content.trim();
    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]");
    const json = text.slice(jsonStart, jsonEnd + 1);
    return JSON.parse(json);
  } catch (e) {
    console.error("Quiz JSON parse error:", e);
    return [];
  }
}
