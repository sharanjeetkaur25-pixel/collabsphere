import express from "express";

import {
  registerUser,
  loginUser,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Registration and login
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected settings routes
router.put("/profile", authMiddleware, updateProfile);
router.put("/change-password", authMiddleware, changePassword);

export default router;