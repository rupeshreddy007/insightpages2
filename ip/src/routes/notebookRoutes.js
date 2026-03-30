// import express from "express";
// import multer from "multer";
// import {
//   ingestDocumentController,
//   chatController,
//   studyGuideController,
//   flashcardController,
//   quizController,
// } from "../services/controllers.js";

// const router = express.Router();
// const upload = multer({ dest: "uploads/" });

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  ingestDocumentController,
  chatController,
  studyGuideController,
  flashcardController,
  quizController,
} from "../services/controllers.js";

const router = express.Router();

// Resolve project-root/uploads reliably
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, "../../uploads");

// create uploads directory if missing
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// configure multer to write to the absolute UPLOAD_DIR
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e6);
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Ingest document into a notebook
// router.post(
//   "/:notebookId/ingest",
//   upload.single("file"),
//   ingestDocumentController
// );
// POST /api/notebook/:notebookId/ingest
// upload.single("file") will populate req.file
router.post(
  "/:notebookId/ingest",
  upload.single("file"),
  (req, res, next) => {
    console.log("UPLOAD DEBUG - req.file:", req.file); // quick server-side debug
    next();
  },
  ingestDocumentController
);


// Chat with notebook
router.post("/:notebookId/chat", chatController);

// Generate study guide
router.post("/:notebookId/study-guide", studyGuideController);

// Generate flashcards
router.post("/:notebookId/flashcards", flashcardController);

// Generate quiz
router.post("/:notebookId/quiz", quizController);

export default router;