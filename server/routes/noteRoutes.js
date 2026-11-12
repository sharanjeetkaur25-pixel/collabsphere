import express from "express";
import {
  createNote,
  getProjectNotes,
  updateNote,
  deleteNote,
} from "../controllers/noteController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });

router.use(protect);

router.post("/", createNote);
router.get("/", getProjectNotes);
router.put("/:noteId", updateNote);
router.delete("/:noteId", deleteNote);

export default router;
