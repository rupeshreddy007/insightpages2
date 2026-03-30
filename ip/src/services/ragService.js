import { chatModel } from "../llm/client.js";
import { getVectorStore } from "../llm/vectorStore.js";

export async function askNotebook(notebookId, query) {
  const store = await getVectorStore(notebookId);
  const retriever = store.asRetriever(5); // top 5 chunks

  const relevantDocs = await retriever.getRelevantDocuments(query);

  const contextText = relevantDocs
    .map(
      (doc, i) =>
        `Chunk ${i + 1} (source: ${doc.metadata.fileName || "unknown"}):\n${doc.pageContent}`
    )
    .join("\n\n");

  const systemPrompt = `
You are an AI research assistant.Answer using ONLY the context provided.
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
