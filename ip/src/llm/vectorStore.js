// Very simple token-based "embedding" and similarity search.
// No external API, completely free.

function tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }
  
  function tokensToSet(tokens) {
    return new Set(tokens);
  }
  
  function jaccard(setA, setB) {
    let intersection = 0;
    for (const t of setA) {
      if (setB.has(t)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    if (union === 0) return 0;
    return intersection / union;
  }
  
  // notebookId -> [{ text, metadata, tokenSet }]
  const notebookStores = {};
  
  export async function addTextsToNotebook(notebookId, texts, metadatas) {
    if (!notebookStores[notebookId]) {
      notebookStores[notebookId] = [];
    }
  
    for (let i = 0; i < texts.length; i++) {
      const tokens = tokenize(texts[i]);
      notebookStores[notebookId].push({
        text: texts[i],
        metadata: metadatas[i] || {},
        tokenSet: tokensToSet(tokens),
      });
    }
  }
  
  export async function similaritySearch(notebookId, query, k = 5) {
    const docs = notebookStores[notebookId] || [];
    if (!docs.length) return [];
  
    const querySet = tokensToSet(tokenize(query));
  
    const scored = docs.map((doc) => ({
      doc,
      score: jaccard(querySet, doc.tokenSet),
    }));
  
    scored.sort((a, b) => b.score - a.score);
  
    return scored.slice(0, k).map((s) => ({
      pageContent: s.doc.text,
      metadata: s.doc.metadata,
    }));
  }
  