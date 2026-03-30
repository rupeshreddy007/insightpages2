import { getVectorStore } from "../llm/vectorStore.js";

export async function getNotebookContextText(notebookId, limit = 20) {
  const store = await getVectorStore(notebookId);
  const docs = await store.similaritySearch("overview", limit);

  return docs
    .map((doc, i) => `Chunk ${i + 1}:\n${doc.pageContent}`)
    .join("\n\n");
}
