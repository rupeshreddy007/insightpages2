import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const { PDFParse } = require("pdf-parse");

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { chatModel } from "../llm/client.js";
import { addTextsToNotebook, similaritySearch } from "../llm/vectorStore.js";

//file ingest 

async function ingestFileToNotebook(notebookId, file) {
  if (!file) {
    throw new Error("No file uploaded");
  }

  const filePath = file.path;
  const ext = file.originalname.split(".").pop().toLowerCase();

  let rawText = "";

  if (ext === "pdf") {
    const dataBuffer = fs.readFileSync(filePath);

    const parser = new PDFParse({ data: dataBuffer });
    const pdfResult = await parser.getText();
    rawText = pdfResult.text || "";
  } else if (["txt", "md"].includes(ext)) {
    rawText = fs.readFileSync(filePath, "utf8");
  } else {
    fs.unlinkSync(filePath);
    throw new Error("Unsupported file type (use pdf/txt/md for now).");
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.splitText(rawText);

  await addTextsToNotebook(
    notebookId,
    chunks,
    chunks.map((_, i) => ({
      notebookId,
      chunkIndex: i,
      fileName: file.originalname,
    }))
  );

  fs.unlinkSync(filePath);

  return { chunksAdded: chunks.length };
}

//getting context

async function getNotebookContextText(notebookId, limit = 20) {
  const docs = await similaritySearch(notebookId, "overview", limit);

  return docs
    .map((doc, i) => `Chunk ${i + 1}:\n${doc.pageContent}`)
    .join("\n\n");
}

//assistant
async function askNotebook(notebookId, query) {
  const relevantDocs = await similaritySearch(notebookId, query, 5);

  const contextText = relevantDocs
    .map(
      (doc, i) =>
        `Chunk ${i + 1} (source: ${doc.metadata.fileName || "unknown"}):\n${doc.pageContent}`
    )
    .join("\n\n");

  const systemPrompt = `
You are an AI research assistant. Answer using ONLY the context provided.
If the answer is not in the context, say you don't know.
Provide clear, structured answers.
`;

  const messages = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Context:\n${contextText}\n\nQuestion: ${query}`,
    },
  ];

  const response = await chatModel.invoke(messages);

  return {
    answer: response.content,
    sources: relevantDocs.map((d) => d.metadata),
  };
}


//sg

async function generateStudyGuide(notebookId, level = "simple") {
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


//fc

async function generateFlashcards(notebookId, count = 15) {
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
//quizzzz
async function generateQuiz(notebookId, count = 10) {
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


export async function ingestDocumentController(req, res) {
  const { notebookId } = req.params;
  const file = req.file;

  try {
    const result = await ingestFileToNotebook(notebookId, file);
    res.json({ success: true, notebookId, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function chatController(req, res) {
  const { notebookId } = req.params;
  const { question } = req.body;

  try {
    const result = await askNotebook(notebookId, question);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function studyGuideController(req, res) {
  const { notebookId } = req.params;
  const { level } = req.body;

  try {
    const guide = await generateStudyGuide(notebookId, level || "simple");
    res.json({ success: true, guide });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function flashcardController(req, res) {
  const { notebookId } = req.params;
  const { count } = req.body;

  try {
    const cards = await generateFlashcards(
      notebookId,
      count ? Number(count) : 15
    );
    res.json({ success: true, cards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function quizController(req, res) {
  const { notebookId } = req.params;
  const { count } = req.body;

  try {
    const quiz = await generateQuiz(
      notebookId,
      count ? Number(count) : 10
    );
    res.json({ success: true, quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}
