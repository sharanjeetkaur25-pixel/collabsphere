import mongoose from "mongoose";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

import Project from "../models/Project.js";
import ProjectFile from "../models/ProjectFile.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const uploadDirectory =
  process.env.UPLOAD_DIR || path.resolve(currentDirectory, "../uploads");
  
const canAccessProject = async (projectId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return null;
  }

  return Project.findOne({
    _id: projectId,
    $or: [{ owner: userId }, { members: userId }],
  });
};

// GET /api/projects/:id/files
export const getProjectFiles = async (req, res) => {
  try {
    const project = await canAccessProject(
      req.params.id,
      req.user.id
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found or access denied",
      });
    }

    const files = await ProjectFile.find({
      project: project._id,
    })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ files });
  } catch (error) {
    console.error("Get project files error:", error);

    return res.status(500).json({
      message: "Failed to fetch project files",
    });
  }
};

// POST /api/projects/:id/files
export const uploadProjectFile = async (req, res) => {
  let storedPath;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Choose a file to upload",
      });
    }

    storedPath = req.file.path;

    const project = await canAccessProject(
      req.params.id,
      req.user.id
    );

    if (!project) {
      await fs.unlink(storedPath).catch(() => {});
      storedPath = null;

      return res.status(404).json({
        message: "Project not found or access denied",
      });
    }

    const file = await ProjectFile.create({
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      project: project._id,
      uploadedBy: req.user.id,
    });

    const populatedFile = await ProjectFile.findById(file._id)
      .populate("uploadedBy", "name email");

    return res.status(201).json({
      message: "File uploaded successfully",
      file: populatedFile,
    });
  } catch (error) {
    if (storedPath) {
      await fs.unlink(storedPath).catch(() => {});
    }

    console.error("Upload project file error:", error);

    return res.status(500).json({
      message: "File upload failed",
    });
  }
};

// GET /api/projects/:id/files/:fileId/preview
export const previewProjectFile = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.fileId)) {
      return res.status(400).json({
        message: "Invalid file ID",
      });
    }

    const project = await canAccessProject(
      req.params.id,
      req.user.id
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found or access denied",
      });
    }

    const file = await ProjectFile.findOne({
      _id: req.params.fileId,
      project: project._id,
    });

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    const filePath = path.resolve(
      uploadDirectory,
      path.basename(file.storedName)
    );

    res.setHeader("Content-Type", file.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename*=UTF-8''${encodeURIComponent(file.originalName)}`
    );
    res.setHeader("X-Content-Type-Options", "nosniff");

    return res.sendFile(filePath, (error) => {
      if (error && !res.headersSent) {
        console.error("Send file error:", error);

        res.status(error.statusCode === 404 ? 404 : 500).json({
          message: "Stored file could not be found",
        });
      }
    });
  } catch (error) {
    console.error("Preview file error:", error);

    return res.status(500).json({
      message: "Unable to preview file",
    });
  }
};

// DELETE /api/projects/:id/files/:fileId
export const deleteProjectFile = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.fileId)) {
      return res.status(400).json({
        message: "Invalid file ID",
      });
    }

    const project = await canAccessProject(
      req.params.id,
      req.user.id
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found or access denied",
      });
    }

    const file = await ProjectFile.findOne({
      _id: req.params.fileId,
      project: project._id,
    });

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    const userId = req.user.id.toString();
    const isOwner = project.owner.toString() === userId;
    const isUploader = file.uploadedBy.toString() === userId;

    if (!isOwner && !isUploader) {
      return res.status(403).json({
        message: "You cannot delete this file",
      });
    }

    await file.deleteOne();

    await fs.unlink(
      path.resolve(uploadDirectory, path.basename(file.storedName))
    ).catch((error) => {
      if (error.code !== "ENOENT") {
        console.error("Could not remove stored file:", error);
      }
    });

    return res.status(200).json({
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete project file error:", error);

    return res.status(500).json({
      message: "Failed to delete file",
    });
  }
};
