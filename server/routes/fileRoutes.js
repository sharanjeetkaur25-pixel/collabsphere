import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import protect from "../middleware/authMiddleware.js";
import {
  getProjectFiles,
  uploadProjectFile,
  previewProjectFile,
  deleteProjectFile,
} from "../controllers/fileController.js";

const router = express.Router({ mergeParams: true });

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const uploadDirectory =
  process.env.UPLOAD_DIR || path.resolve(currentDirectory, "../uploads");
  
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedExtensions = new Set([
  ".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp",
  ".txt", ".md", ".js", ".jsx", ".ts", ".tsx",
  ".json", ".css", ".html", ".py", ".java",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.has(extension)) {
      return callback(new Error("This file type is not supported"));
    }

    callback(null, true);
  },
});

router.use(protect);

router.get("/", getProjectFiles);

router.post("/", (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Maximum file size is 5 MB"
            : error.message,
      });
    }

    next();
  });
}, uploadProjectFile);

router.get("/:fileId/preview", previewProjectFile);
router.delete("/:fileId", deleteProjectFile);

export default router;
