import express from "express";
import {
  explainNote,
  improveNote,
  explainProjectCode,
  generateProjectReadme,
} from "../controllers/geminiController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All Gemini routes require authentication
router.use(authMiddleware);

router.post("/explain", explainNote);
router.post("/docs", improveNote);
router.post("/code", explainProjectCode);
router.post("/readme", generateProjectReadme);

export default router;
