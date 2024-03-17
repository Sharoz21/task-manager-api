import express from "express";
import {
  forgotPassword,
  isAdmin,
  isAuthenticated,
  isInvited,
  resetPassword,
} from "../controllers/authController";
import {
  createUser,
  createUserInvite,
  getMe,
  updateMe,
  userLogin,
  userLogout,
} from "../controllers/userController";
const router = express.Router();

router
  .post("/forgotPassword", forgotPassword)
  .patch("/resetPassword/:token", resetPassword)
  .post("/invite", isAuthenticated, isAdmin, createUserInvite)
  .post("/login", userLogin)
  .post("/logout", isAuthenticated, userLogout)
  .post("/:token", isInvited, createUser)
  .patch("/", isAuthenticated, updateMe)
  .get("/me", isAuthenticated, getMe);

module.exports = router;
