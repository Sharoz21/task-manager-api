import { Request, Response, NextFunction } from "express";
import User from "../models/user";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { isValidEmail } from "../utils/emailValidation";
import Invitation from "../models/invitation";
import { catchAsyncError } from "../utils/catchAsyncError";
import AppError from "../utils/appError";
import { IGetUserAuthInfoRequest, IGetUserEmailRequest } from "../types";

export const generateAuthJWT = (userId: mongoose.Types.ObjectId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET_KEY as string, {
    expiresIn: "7d",
  });
};

const generateInviteToken = (email: string) =>
  jwt.sign({ email }, process.env.JWT_SECRET_KEY as string, {
    expiresIn: "1d",
  });

export const createUser = catchAsyncError(
  async (req: IGetUserEmailRequest, res: Response, next: NextFunction) => {
    const user = new User({
      ...req.body,
      email: req.email,
      isAdmin: false,
    });
    await user.save();
    return res.status(200).json(user);
  }
);

export const userLogin = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const user = await User.getUserByCredentials(email, password);
    const token = generateAuthJWT(user.id);
    user.tokens.push({ token });
    await user.save();
    return res.status(200).json({ ...user, token });
  }
);
export const userLogout = catchAsyncError(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    req.user.tokens = [];
    await req.user.save();

    return res.status(200).json({ message: "User logged out!" });
  }
);

export const updateMe = catchAsyncError(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    const updates = Object.keys(req.body || {});

    // ideally email should also be reset by sending out a magic link to the existing email
    const allowedUpdates = ["name", "email"];

    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) return next(new AppError("Invalid Updates.", 400));

    const user = await User.findByIdAndUpdate(req.user.id, req.body, {
      runValidators: true,
      new: true,
    });

    if (user) {
      return res.status(200).json(user);
    }

    return next(new AppError("Unauthorized Access", 401));
  }
);

export const createUserInvite = catchAsyncError(
  async (
    req: Request,
    res: Response<{ token: string }>,
    next: NextFunction
  ) => {
    const { email } = req.body;

    if (!isValidEmail(email)) throw new AppError("Invalid Email address", 500);

    const inviteToken = generateInviteToken(email);

    //if the email already exists in db, refresh the token
    await Invitation.findOneAndUpdate(
      { email },
      { email, token: inviteToken, valid: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ token: inviteToken });
  }
);

export const getMe = catchAsyncError(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    console.log(req.user.id);
    const user = await User.findById(req?.user?.id).select("name email");

    return res.status(200).json(user);
  }
);
