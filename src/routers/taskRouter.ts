import express from "express";
import { isAdmin, isAuthenticated } from "../controllers/authController";
import {
  createTask,
  deleteTaskById,
  getAllTasks,
  getTaskById,
  getUserTasks,
  updateTaskById,
} from "../controllers/taskController";

const router = express.Router();

router
  .get("/all", isAuthenticated, isAdmin, getAllTasks)
  .get("/:id", isAuthenticated, getTaskById)
  .post("/", isAuthenticated, createTask)
  .get("/", isAuthenticated, getUserTasks)
  .patch("/:id", isAuthenticated, updateTaskById)
  .delete("/:id", isAuthenticated, deleteTaskById);

module.exports = router;
