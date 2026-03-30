import express from "express";
import dotenv from "dotenv";
import notebookRoutes from "./routes/notebookRoutes.js";
import cors from "cors";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());
app.use("/api/notebook", notebookRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`AI Notebook server running on port ${PORT}`);
});