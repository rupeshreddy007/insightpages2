import fs from "fs";
import pdfParse from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getVectorStore } from "../llm/vectorStore.js";

export async function ingestFileToNotebook(notebookId, file) {
  const filePath = file.path;
  const ext = file.originalname.split(".").pop().toLowerCase();

  let rawText = "";

  if (ext === "pdf") {
    const dataBuffer = fs.readFileSync(filePath);
    const parser = new pdfParse({ data: dataBuffer });
  
    const pdfResult = await parser.getText();
    rawText = pdfResult.text;
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

  return { chunksAdded: chunks.length };
}