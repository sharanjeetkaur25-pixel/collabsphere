import express from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  inviteProjectMember,
} from "../controllers/projectController.js";
import protect from "../middleware/authMiddleware.js";
import noteRoutes from "./noteRoutes.js";
import fileRoutes from "./fileRoutes.js";
import { getProjectAnalytics } from "../controllers/analyticsController.js";
import {
  enablePublicSharing,
  disablePublicSharing,
} from "../controllers/publicProjectController.js";

const router = express.Router();

router.use(protect);

// Project CRUD
router.post("/", createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.get("/:id/analytics", getProjectAnalytics);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);
router.post("/:id/share", enablePublicSharing);
router.delete("/:id/share", disablePublicSharing);

// Project membersdone 

router.post("/:id/members", inviteProjectMember);

// Project notes
router.use("/:id/notes", noteRoutes);

// Project files
router.use("/:id/files", fileRoutes);

export default router;
