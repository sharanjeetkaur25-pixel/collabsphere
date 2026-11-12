import mongoose from "mongoose";
import Project from "../models/Project.js";
import Note from "../models/Note.js";
import ProjectFile from "../models/ProjectFile.js";

// GET /api/projects/:id/analytics
export const getProjectAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    // Only the project owner and invited members can view analytics.
    const project = await Project.findOne({
      _id: id,
      $or: [
        { owner: req.user.id },
        { members: req.user.id },
      ],
    })
      .populate("owner", "name email")
      .populate("members", "name email");

    if (!project) {
      return res.status(404).json({
        message: "Project not found or access denied",
      });
    }

    const [notes, files] = await Promise.all([
      Note.find({ project: project._id })
        .populate("author", "name email")
        .populate("lastEditedBy", "name email")
        .sort({ updatedAt: -1 }),

      ProjectFile.find({ project: project._id })
        .populate("uploadedBy", "name email")
        .sort({ createdAt: -1 }),
    ]);

    // Include the owner and every invited member, even if
    // they have not contributed yet.
    const users = new Map();

    const addUser = (user) => {
      if (user?._id) {
        users.set(user._id.toString(), {
          id: user._id,
          name: user.name || "Unknown user",
          email: user.email || "",
          notesCreated: 0,
          notesLastEdited: 0,
          filesUploaded: 0,
        });
      }
    };

    addUser(project.owner);
    project.members.forEach(addUser);

    const getContributor = (user) => {
      if (!user?._id) return null;

      const key = user._id.toString();

      if (!users.has(key)) {
        addUser(user);
      }

      return users.get(key);
    };

    notes.forEach((note) => {
      const author = getContributor(note.author);
      const editor = getContributor(note.lastEditedBy);

      if (author) author.notesCreated += 1;
      if (editor) editor.notesLastEdited += 1;
    });

    files.forEach((file) => {
      const uploader = getContributor(file.uploadedBy);

      if (uploader) uploader.filesUploaded += 1;
    });

    const contributions = Array.from(users.values()).map((user) => ({
      ...user,
      totalContributions:
        user.notesCreated +
        user.notesLastEdited +
        user.filesUploaded,
    }));

    contributions.sort(
      (a, b) => b.totalContributions - a.totalContributions
    );

    // Build a combined recent-activity feed from existing records.
    const recentActivity = [
      ...notes.map((note) => ({
        type: "note",
        action: "created",
        title: note.title,
        user: note.author
          ? {
              id: note.author._id,
              name: note.author.name,
              email: note.author.email,
            }
          : null,
        date: note.createdAt,
      })),
      ...files.map((file) => ({
        type: "file",
        action: "uploaded",
        title: file.originalName,
        user: file.uploadedBy
          ? {
              id: file.uploadedBy._id,
              name: file.uploadedBy.name,
              email: file.uploadedBy.email,
            }
          : null,
        date: file.createdAt,
      })),
      ...notes
        .filter(
          (note) =>
            note.updatedAt &&
            note.createdAt &&
            note.updatedAt.getTime() !== note.createdAt.getTime()
        )
        .map((note) => ({
          type: "note",
          action: "edited",
          title: note.title,
          user: note.lastEditedBy
            ? {
                id: note.lastEditedBy._id,
                name: note.lastEditedBy.name,
                email: note.lastEditedBy.email,
              }
            : null,
          date: note.updatedAt,
        })),
    ];

    recentActivity.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    return res.status(200).json({
      summary: {
        projectName: project.name,
        status: project.status,
        totalMembers: users.size,
        totalNotes: notes.length,
        totalFiles: files.length,
        totalContributions: contributions.reduce(
          (total, user) => total + user.totalContributions,
          0
        ),
      },
      contributions,
      recentActivity: recentActivity.slice(0, 10),
    });
  } catch (error) {
    console.error("Project analytics error:", error);

    return res.status(500).json({
      message: "Failed to fetch project analytics",
    });
  }
};
