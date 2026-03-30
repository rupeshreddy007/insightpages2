import { chatModel } from "../llm/client.js";
import { getNotebookContextText } from "./utils.js";

export async function generateStudyGuide(notebookId, level = "simple") {
  const contextText = await getNotebookContextText(notebookId, 30);

  const prompt = `
You are an AI tutor. Based on the context below, create a structured study guide.
Explain in ${level} language.

Context:
${contextText}

Study Guide Format:
1. Overview (3-5 sentences)
2. Key Concepts (bullet points)
3. Important Definitions
4. Examples (if possible)
5. Possible Exam/Interview Questions
`;

  const res = await chatModel.invoke([{ role: "user", content: prompt }]);
  return res.content;
}
