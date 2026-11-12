import express from "express";
import { getPublicProject } from "../controllers/publicProjectController.js";

const router = express.Router();

router.get("/projects/:token", getPublicProject);

export default router;