import { chatModel } from "../llm/client.js";
import { getNotebookContextText } from "./utils.js";

export async function generateFlashcards(notebookId, count = 25) {
  const contextText = await getNotebookContextText(notebookId, 25);

  const prompt = `
Create ${count} Q/A flashcards from the following context.
Return JSON array with objects like:
[
  {"question": "...", "answer": "..."},
  ...
]

Context:
${contextText}
`;

  const res = await chatModel.invoke([{ role: "user", content: prompt }]);

  // Try to parse JSON
  try {
    const text = res.content.trim();
    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]");
    const json = text.slice(jsonStart, jsonEnd + 1);
    return JSON.parse(json);
  } catch (e) {
    console.error("Flashcard JSON parse error:", e);
    return [];
  }
}
