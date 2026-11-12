import mongoose from "mongoose";
import Project from "../models/Project.js";
import Note from "../models/Note.js";
import ProjectFile from "../models/ProjectFile.js";

// POST /api/projects/:id/share
// Enable public sharing. Only the project owner can do this.
export const enablePublicSharing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findOne({
      _id: id,
      owner: req.user.id,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not the owner",
      });
    }

    project.enablePublicSharing();
    await project.save();

    return res.status(200).json({
      message: "Public sharing enabled",
      publicToken: project.publicToken,
      publicUrl: `/public/projects/${project.publicToken}`,
    });
  } catch (error) {
    console.error("Enable public sharing error:", error);
    return res.status(500).json({
      message: "Failed to enable public sharing",
    });
  }
};

// DELETE /api/projects/:id/share
// Only the project owner can disable public sharing.
export const disablePublicSharing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findOne({
      _id: id,
      owner: req.user.id,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not the owner",
      });
    }

    project.disablePublicSharing();
    await project.save();

    return res.status(200).json({
      message: "Public sharing disabled",
    });
  } catch (error) {
    console.error("Disable public sharing error:", error);
    return res.status(500).json({
      message: "Failed to disable public sharing",
    });
  }
};

// GET /api/public/projects/:token
// Public read-only project information; no login required.
export const getPublicProject = async (req, res) => {
  try {
    const { token } = req.params;

    const project = await Project.findOne({
      publicToken: token,
      isPublic: true,
    })
      .select("name description status owner createdAt")
      .populate("owner", "name");

    if (!project) {
      return res.status(404).json({
        message: "Public project not found or sharing has been disabled",
      });
    }

    const [notes, files] = await Promise.all([
      Note.find({ project: project._id })
        .select("title content createdAt updatedAt")
        .sort({ updatedAt: -1 }),

      ProjectFile.find({ project: project._id })
        .select("originalName mimeType size createdAt"),
    ]);

    return res.status(200).json({
      project,
      notes,
      files,
    });
  } catch (error) {
    console.error("Get public project error:", error);
    return res.status(500).json({
      message: "Failed to load public project",
    });
  }
};
