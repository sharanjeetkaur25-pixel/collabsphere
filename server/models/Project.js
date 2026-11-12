import mongoose from "mongoose";
import crypto from "crypto";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["planning", "in-progress", "completed"],
      default: "planning",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Public read-only sharing
    isPublic: {
      type: Boolean,
      default: false,
    },
    publicToken: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Generate a hard-to-guess token when public sharing is enabled.
projectSchema.methods.enablePublicSharing = function () {
  if (!this.publicToken) {
    this.publicToken = crypto.randomBytes(32).toString("hex");
  }

  this.isPublic = true;
};

// Disable sharing without deleting the project.
projectSchema.methods.disablePublicSharing = function () {
  this.isPublic = false;
};

const Project = mongoose.model("Project", projectSchema);

export default Project;
