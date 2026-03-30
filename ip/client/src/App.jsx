import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "./config";

function App() {
  const [notebookId, setNotebookId] = useState("demo");
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  const [activeTab, setActiveTab] = useState("chat");

  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  const [studyGuide, setStudyGuide] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [quiz, setQuiz] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const apiBase = `${BACKEND_URL}/api/notebook/${notebookId}`;

  async function handleUpload(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!file) {
      setUploadStatus("Please choose a file first.");
      return;
    }

    try {
      setUploadStatus("Uploading & ingesting...");
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`${apiBase}/ingest`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setUploadStatus(
          `Ingested ${res.data.chunksAdded} chunks into notebook "${notebookId}".`
        );
      } else {
        setUploadStatus("Upload failed.");
        setErrorMsg(res.data.error || "Unknown error");
      }
    } catch (err) {
      console.error(err);
      setUploadStatus("Upload failed.");
      setErrorMsg(
        err.response?.data?.error || err.message || "Server error during upload."
      );
    }
  }

  async function handleAsk(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!question.trim()) return;

    const userMessage = { role: "user", content: question };
    setChatHistory((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await axios.post(`${apiBase}/chat`, { question });
      const botMessage = {
        role: "assistant",
        content: res.data.answer,
        sources: res.data.sources || [],
      };
      setChatHistory((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.error || err.message || "Error contacting notebook."
      );
      const botMessage = {
        role: "assistant",
        content:
          "I couldn't get an answer from the backend. Please check server logs.",
      };
      setChatHistory((prev) => [...prev, botMessage]);
    } finally {
      setLoading(false);
    }
  }

  async function runStudyGuide() {
    setActiveTab("study");
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await axios.post(`${apiBase}/study-guide`, {
        level: "simple",
      });
      setStudyGuide(res.data.guide || "");
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.error ||
          err.message ||
          "Failed to generate study guide."
      );
      setStudyGuide("");
    } finally {
      setLoading(false);
    }
  }

  async function runFlashcards() {
    setActiveTab("flashcards");
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await axios.post(`${apiBase}/flashcards`, {
        count: 12,
      });
      setFlashcards(res.data.cards || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.error ||
          err.message ||
          "Failed to generate flashcards."
      );
      setFlashcards([]);
    } finally {
      setLoading(false);
    }
  }

  async function runQuiz() {
    setActiveTab("quiz");
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await axios.post(`${apiBase}/quiz`, {
        count: 6,
      });
      setQuiz(res.data.quiz || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.error || err.message || "Failed to generate quiz."
      );
      setQuiz([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>InsightPages</h1>
            <p style={styles.subtitle}>
              Upload notes or PDFs → chat, study, and revise with AI.
            </p>
          </div>
        </header>

        <main style={styles.main}>
          {/* LEFT: Notebook & upload */}
          <section style={styles.leftPane}>
            <h2 style={styles.sectionTitle}>Notebook</h2>

            <label style={styles.label}>
              Notebook ID
              <input
                style={styles.input}
                value={notebookId}
                onChange={(e) => setNotebookId(e.target.value)}
                placeholder="e.g. demo, dbms, ai-notes"
              />
            </label>

            <form onSubmit={handleUpload} style={{ marginTop: "1rem" }}>
              <label style={styles.label}>
                Upload document
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                  style={styles.fileInput}
                />
              </label>
              <button type="submit" style={{ ...styles.button, marginTop: "0.75rem" }}>
                Upload & Ingest
              </button>
            </form>

            {uploadStatus && <p style={styles.status}>{uploadStatus}</p>}
            {errorMsg && <p style={styles.error}>{errorMsg}</p>}

            <div style={{ marginTop: "2rem" }}>
              <h3 style={styles.sectionTitle}>Tips</h3>
              <ul style={styles.tipList}>
                <li>Use the same notebook ID for ingest and chat.</li>
                <li>Upload clear PDFs or .txt files.</li>
                <li>
                  Try asking: <code>"Summarize this in 5 bullet points."</code>
                </li>
              </ul>
            </div>
          </section>

          {/* RIGHT: Chat + tools */}
          <section style={styles.rightPane}>
            {/* Tabs */}
            {/* Tabs */}
            <div style={styles.tabRow}>
              <button
                style={{
                  ...styles.tabButton,
                  ...(activeTab === "chat" ? styles.tabActive : {}),
                }}
                onClick={() => setActiveTab("chat")}
              >
                Chat
              </button>

              <button
                style={{
                  ...styles.tabButton,
                  ...(activeTab === "study" ? styles.tabActive : {}),
                }}
                onClick={runStudyGuide}
              >
                Study Guide
              </button>

              <button
                style={{
                  ...styles.tabButton,
                  ...(activeTab === "flashcards" ? styles.tabActive : {}),
                }}
                onClick={runFlashcards}
              >
                Flashcards
              </button>

              <button
                style={{
                  ...styles.tabButton,
                  ...(activeTab === "quiz" ? styles.tabActive : {}),
                }}
                onClick={runQuiz}
              >
                Quiz
              </button>
            </div>


            {loading && <p style={styles.status}>Thinking…</p>}

            {/* CHAT */}
            {activeTab === "chat" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={styles.chatBox}>
                  {chatHistory.length === 0 && (
                    <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                      Start by uploading a document, then ask a question about it.
                    </p>
                  )}
                  {chatHistory.map((msg, idx) => {
                        const bubbleStyle = {
                           ...styles.chatMessage,
                           ...(msg.role === "user" ? styles.userBubble : styles.botBubble),
                         };
                         return (
                            <div key={idx} style={bubbleStyle}>
                             <strong>{msg.role === "user" ? "You" : "InsightPages"}:</strong>
                             <p style={{ whiteSpace: "pre-wrap", marginTop: "0.25rem" }}>
                               {msg.content}
                             </p>
                             {msg.sources && msg.sources.length > 0 && (
                              <small style={{ display: "block", marginTop: "0.25rem", color: "#6b7280" }}>
                                 Sources: {msg.sources.map((s) => s.fileName || "unknown").join(", ")}
                              </small>
                              )}
                           </div>
                         );
                       })}
                </div>

                <form onSubmit={handleAsk} style={styles.chatForm}>
                  <input
                    style={styles.input}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask something about your notebook…"
                  />
                  <button type="submit" style={styles.button}>
                    Ask
                  </button>
                </form>
              </div>
            )}

            {/* STUDY GUIDE */}
            {activeTab === "study" && (
              <div style={styles.textAreaBox}>
                {studyGuide ? (
                  <pre style={styles.pre}>{studyGuide}</pre>
                ) : (
                  <p style={styles.placeholder}>
                    Click “Study Guide” to generate a structured summary of your notes.
                  </p>
                )}
              </div>
            )}

            {/* FLASHCARDS */}
            {activeTab === "flashcards" && (
              <div style={styles.textAreaBox}>
                {flashcards.length ? (
                  <ul style={{ paddingLeft: "1.1rem" }}>
                    {flashcards.map((card, i) => (
                      <li key={i} style={{ marginBottom: "0.75rem" }}>
                        <p>
                          <strong>Q{i + 1}:</strong> {card.question}
                        </p>
                        <p>
                          <strong>A:</strong> {card.answer}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={styles.placeholder}>
                    Click “Flashcards” to generate question–answer pairs.
                  </p>
                )}
              </div>
            )}

            {/* QUIZ */}
            {activeTab === "quiz" && (
              <div style={styles.textAreaBox}>
                {quiz.length ? (
                  <ol>
                    {quiz.map((q, i) => (
                      <li key={i} style={{ marginBottom: "1rem" }}>
                        <p>
                          <strong>Q{i + 1}:</strong> {q.question}
                        </p>
                        <ul style={{ paddingLeft: "1.2rem" }}>
                          {q.options?.map((opt, idx) => (
                            <li key={idx}>
                              {String.fromCharCode(65 + idx)}. {opt}
                            </li>
                          ))}
                        </ul>
                        <p style={{ marginTop: "0.25rem" }}>
                          <strong>Correct:</strong>{" "}
                          {q.options?.[q.correctIndex] ?? "N/A"}
                        </p>
                        {q.explanation && (
                          <p style={{ fontSize: "0.85rem", color: "#4b5563" }}>
                            <em>{q.explanation}</em>
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p style={styles.placeholder}>
                    Click “Quiz” to generate MCQs from your notebook.
                  </p>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

const styles = {
 // page
page: {
  minHeight: "100vh",
  width: "100vw",
  display: "block",
  padding: "0",
  boxSizing: "border-box",
},

// container
container: {
  width: "100vw",
  maxWidth: "100vw",
  margin: 0,
  borderRadius: 0,
  padding: "1.5rem",
  boxSizing: "border-box",
  background: "white",
  display: "flex",
  flexDirection: "column",
},


  // page: {
  //   minHeight: "100vh",
  //   width: "1470px",
  //   background:
  //     "radial-gradient(circle at top, rgba(129,140,248,0.06), transparent 55%), #f6f7fb",
  //   display: "flex",
  //   justifyContent: "flex-start",
  //   alignItems: "flex-start",
  //   padding: "2rem 1rem",
  //   boxSizing: "border-box",
  // },
  
  // container: {
  //   width: "100%",
  //   maxWidth: "1400px",
  //   margin: "0 auto",
  //   background: "white",
  //   borderRadius: "1.25rem",
  //   boxShadow: "0 20px 45px rgba(15,23,42,0.06)",
  //   padding: "1.5rem 1.75rem",
  //   display: "flex",
  //   flexDirection: "column",
  //   gap: "1rem",
  //   boxSizing: "border-box",
  // },
  main: {
     display: "grid", 
     gridTemplateColumns: "320px 1fr",
     gap: "1.25rem", },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
  },
  title: {
    fontSize: "1.6rem",
    fontWeight: 700,
    letterSpacing: "0.02em",
    color: "#111827",
  },
  subtitle: {
    fontSize: "0.95rem",
    color: "#6b7280",
  },
  leftPane: {
    borderRadius: "0.9rem",
    border: "1px solid #eef2f7",
    padding: "1rem 1rem",
    backgroundColor: "#fbfdff",
    display: "flex",
    flexDirection: "column",
  },
  rightPane: {
    borderRadius: "0.9rem",
    border: "1px solid #eef2f7",
    padding: "1rem 1rem",
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    minHeight: "520px",
  },
  sectionTitle: {
    fontSize: "0.98rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
    color: "#0f172a",
  },
  label: {
    fontSize: "0.88rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
    color: "#374151",
  },
  input: {
    borderRadius: "0.6rem",
    border: "1px solid #e6edf3",
    padding: "0.7rem 1rem", 
    fontSize: "1rem",
    outline: "none",
    color: "#0f172a",
    background: "white",
    flex: 1,
    height: "48px",
    boxSizing: "border-box",
  },
  
  fileInput: {
    marginTop: "0.2rem",
  },
  button: {
    border: "none",
    borderRadius: "0.65rem",
    padding: "0.55rem 1rem",
    fontSize: "0.9rem",
    cursor: "pointer",
    background: "linear-gradient(135deg, #5b21b6, #db2777)",
    color: "white",
    fontWeight: 600,
  },
  status: {
    marginTop: "0.6rem",
    fontSize: "0.9rem",
    color: "#374151",
  },
  error: {
    marginTop: "0.5rem",
    fontSize: "0.9rem",
    color: "#dc2626",
  },
  tipList: {
    marginTop: "0.25rem",
    fontSize: "0.88rem",
    color: "#6b7280",
    paddingLeft: "1.1rem",
  },
  tabRow: {
    display: "flex",
    gap: "0.5rem",
    borderBottom: "1px solid #eef2f7",
    paddingBottom: "0.25rem",
    marginBottom: "0.75rem",
  },
  tabButton: {
    border: "none",
    borderRadius: "999px",
    padding: "0.35rem 0.85rem",
    fontSize: "0.88rem",
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "#374151",
  },
  tabActive: {
    backgroundColor: "#eef2ff",
    color: "#4338ca",
    boxShadow: "inset 0 -3px 0 rgba(67,56,202,0.08)",
  },
  chatBox: {
    flex: 1,
    borderRadius: "0.75rem",
    border: "1px solid #eef2f7",
    padding: "0.8rem",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
    marginBottom: "0.6rem",
    minHeight: "320px",
    background: "#ffffff",
  },
  chatMessage: {
    borderRadius: "0.75rem",
    padding: "0.5rem 0.75rem",
    maxWidth: "78%",
    fontSize: "0.95rem",
    color: "#0f172a",
    lineHeight: 1.4,
    boxShadow: "0 1px 0 rgba(15,23,42,0.02)",
  },
  userBubble: {
    alignSelf: "flex-end",
    background: "linear-gradient(90deg, rgba(79,70,229,0.08), rgba(236,72,153,0.08))",
    color: "#111827",
  },
  botBubble: {
    alignSelf: "flex-start",
    background: "#f3f4f6",
    color: "#0f172a",
  },
  chatForm: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "auto",
    alignItems: "center",
    width: "100%",
  },
  
  textAreaBox: {
    flex: 1,
    borderRadius: "0.75rem",
    border: "1px solid #eef2f7",
    padding: "0.9rem",
    overflowY: "auto",
    backgroundColor: "#fbfdff",
    minHeight: "260px",
    fontSize: "0.95rem",
    color: "#0f172a",
  },
  pre: {
    whiteSpace: "pre-wrap",
    fontFamily: "inherit",
    fontSize: "0.95rem",
    color: "#0f172a",
  },
  placeholder: {
    fontSize: "0.92rem",
    color: "#6b7280",
  },
};


export default App;
