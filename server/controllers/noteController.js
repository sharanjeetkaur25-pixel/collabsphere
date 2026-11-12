import mongoose from "mongoose";
import Project from "../models/Project.js";
import Note from "../models/Note.js";

const getAccessibleProject = (projectId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return Promise.resolve(null);
  }

  return Project.findOne({
    _id: projectId,
    $or: [{ owner: userId }, { members: userId }],
  });
};

// POST /api/projects/:id/notes
export const createNote = async (req, res) => {
  try {
    const { title, content = "" } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Note title is required" });
    }

    const project = await getAccessibleProject(req.params.id, req.user.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found or access denied" });
    }

    const note = await Note.create({
      title: title.trim(),
      content,
      project: project._id,
      author: req.user.id,
      lastEditedBy: req.user.id,
    });

    const populatedNote = await Note.findById(note._id)
      .populate("author", "name email")
      .populate("lastEditedBy", "name email");

    return res.status(201).json({
      message: "Note created successfully",
      note: populatedNote,
    });
  } catch (error) {
    console.error("Create note error:", error);
    return res.status(500).json({ message: "Failed to create note" });
  }
};

// GET /api/projects/:id/notes
export const getProjectNotes = async (req, res) => {
  try {
    const project = await getAccessibleProject(req.params.id, req.user.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found or access denied" });
    }

    const notes = await Note.find({ project: project._id })
      .populate("author", "name email")
      .populate("lastEditedBy", "name email")
      .sort({ updatedAt: -1 });

    return res.status(200).json({ notes });
  } catch (error) {
    console.error("Fetch notes error:", error);
    return res.status(500).json({ message: "Failed to fetch notes" });
  }
};

// PUT /api/projects/:id/notes/:noteId
export const updateNote = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ message: "Note title cannot be empty" });
    }

    const project = await getAccessibleProject(req.params.id, req.user.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found or access denied" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.noteId)) {
      return res.status(400).json({ message: "Invalid note ID" });
    }

    const updates = { lastEditedBy: req.user.id };

    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = content;

    const note = await Note.findOneAndUpdate(
      { _id: req.params.noteId, project: project._id },
      updates,
      { new: true, runValidators: true }
    )
      .populate("author", "name email")
      .populate("lastEditedBy", "name email");

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    return res.status(200).json({
      message: "Note saved successfully",
      note,
    });
  } catch (error) {
    console.error("Update note error:", error);
    return res.status(500).json({ message: "Failed to save note" });
  }
};

// DELETE /api/projects/:id/notes/:noteId
export const deleteNote = async (req, res) => {
  try {
    const project = await getAccessibleProject(req.params.id, req.user.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found or access denied" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.noteId)) {
      return res.status(400).json({ message: "Invalid note ID" });
    }

    const note = await Note.findOneAndDelete({
      _id: req.params.noteId,
      project: project._id,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    return res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Delete note error:", error);
    return res.status(500).json({ message: "Failed to delete note" });
  }
};
