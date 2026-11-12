import Project from "../models/Project.js";
import User from "../models/User.js";

// POST /api/projects
export const createProject = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Project name is required",
      });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description?.trim() || "",
      status: status || "planning",
      owner: req.user.id,
    });

    const populatedProject = await Project.findById(project._id)
      .populate("owner", "name email")
      .populate("members", "name email");

    return res.status(201).json({
      message: "Project created successfully",
      project: populatedProject,
    });
  } catch (error) {
    console.error("Create project error:", error);

    return res.status(500).json({
      message: "Failed to create project",
    });
  }
};

// GET /api/projects
// Returns projects owned by the user and projects shared with them.
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user.id },
        { members: req.user.id },
      ],
    })
      .populate("owner", "name email")
      .populate("members", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ projects });
  } catch (error) {
    console.error("Fetch projects error:", error);

    return res.status(500).json({
      message: "Failed to fetch projects",
    });
  }
};

// GET /api/projects/:id
// Allows the owner or an invited member to open a project.
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user.id },
        { members: req.user.id },
      ],
    })
      .populate("owner", "name email")
      .populate("members", "name email");

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    return res.status(200).json({ project });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    console.error("Fetch project details error:", error);

    return res.status(500).json({
      message: "Failed to fetch project",
    });
  }
};

// PUT /api/projects/:id
// Only the project owner can update it.
export const updateProject = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        message: "Project name cannot be empty",
      });
    }

    const allowedStatuses = [
      "planning",
      "in-progress",
      "completed",
    ];

    if (
      status !== undefined &&
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        message: "Invalid project status",
      });
    }

    const updates = {};

    if (name !== undefined) {
      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = description.trim();
    }

    if (status !== undefined) {
      updates.status = status;
    }

    const project = await Project.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user.id,
      },
      updates,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("owner", "name email")
      .populate("members", "name email");

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    return res.status(200).json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    console.error("Update project error:", error);

    return res.status(500).json({
      message: "Failed to update project",
    });
  }
};

// DELETE /api/projects/:id
// Only the project owner can delete it.
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    return res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    console.error("Delete project error:", error);

    return res.status(500).json({
      message: "Failed to delete project",
    });
  }
};

// POST /api/projects/:id/members
// Only the project owner can invite members.
export const inviteProjectMember = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not the owner",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        message: "No CollabSphere user exists with that email",
      });
    }

    if (user._id.toString() === project.owner.toString()) {
      return res.status(400).json({
        message: "The project owner is already a member",
      });
    }

    const alreadyMember = project.members.some(
      (memberId) =>
        memberId.toString() === user._id.toString()
    );

    if (alreadyMember) {
      return res.status(409).json({
        message: "This user is already a project member",
      });
    }

    project.members.push(user._id);
    await project.save();

    return res.status(200).json({
      message: `${user.name} added to the project successfully`,
      member: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    console.error("Invite project member error:", error);

    return res.status(500).json({
      message: "Failed to invite project member",
    });
  }
};
