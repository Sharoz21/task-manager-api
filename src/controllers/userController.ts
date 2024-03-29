import { Request, Response, NextFunction } from "express";
import User, { IToken } from "../models/user";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { isValidEmail } from "../utils/emailValidation";
import Invitation from "../models/invitation";
import { catchAsyncError } from "../utils/catchAsyncError";
import AppError from "../utils/appError";
import {
  IGetUserAuthInfoRequest,
  IGetUserEmailRequest,
  ITokenResponse,
  IUserPublicInfoResponse,
} from "../types";

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
  async (
    req: IGetUserEmailRequest,
    res: IUserPublicInfoResponse,
    next: NextFunction
  ) => {
    const userQuery = new User({
      ...req.body,
      email: req.email,
      isAdmin: false,
    });
    const user = await userQuery.save();
    return res.status(200).json({ name: user.name, email: user.email });
  }
);

export const userLogin = catchAsyncError(
  async (req: Request, res: ITokenResponse, next: NextFunction) => {
    const { email, password } = req.body;
    const user = await User.getUserByCredentials(email, password);
    const token = generateAuthJWT(user.id);
    user.tokens.push({ token });
    await user.save();
    return res.status(200).json({ token });
  }
);
export const userLogout = catchAsyncError(
  async (
    req: IGetUserAuthInfoRequest,
    res: Response<{ message: string }>,
    next: NextFunction
  ) => {
    req.user.tokens = [];
    await req.user.save();

    return res.status(200).json({ message: "User logged out!" });
  }
);

export const updateMe = catchAsyncError(
  async (
    req: IGetUserAuthInfoRequest,
    res: IUserPublicInfoResponse,
    next: NextFunction
  ) => {
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
    }).select("name email");

    if (user) {
      return res.status(200).json(user);
    }

    return next(new AppError("Unauthorized Access", 401));
  }
);

export const createUserInvite = catchAsyncError(
  async (req: Request, res: ITokenResponse, next: NextFunction) => {
    const { email } = req.body;

    if (!isValidEmail(email)) throw new AppError("Invalid Email address", 500);

    const inviteToken = generateInviteToken(email);

    //if the email already exists in db, refresh the token
    await Invitation.findOneAndUpdate(
      { email },
      { email, token: inviteToken },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ token: inviteToken });
  }
);

export const getMe = catchAsyncError(
  async (
    req: IGetUserAuthInfoRequest,
    res: IUserPublicInfoResponse,
    next: NextFunction
  ) => {
    const user = await User.findById(req?.user?.id).select("name email");

    return res.status(200).json(user);
  }
);
