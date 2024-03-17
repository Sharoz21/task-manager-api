import { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/user";
import { catchAsyncError } from "../utils/catchAsyncError";
import AppError from "../utils/appError";
import "dotenv/config";
import {
  IGetUserAuthInfoRequest,
  IGetUserEmailRequest,
  ITokenResponse,
} from "../types";
import Invitation from "../models/invitation";
import { generateAuthJWT } from "./userController";

const verifyJWT = (incomingJWT: string) => {
  return jwt.verify(incomingJWT, process.env.JWT_SECRET_KEY as string);
};

export const isAuthenticated = catchAsyncError(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    const { headers } = req;
    let token = headers.authorization?.split(" ")[1];
    let user;

    if (!token) {
      return next(new AppError("Please login to access this resource.", 401));
    }

    const payload = verifyJWT(token) as JwtPayload;

    if (payload?.userId) {
      user = await User.findOne({ _id: payload.userId, "tokens.token": token });
    }

    if (!user)
      return next(
        new AppError(
          "Please log in to access this resource. This might be the result of a password change",
          401
        )
      );

    if (user?.passwordChangedAt && payload?.iat) {
      if (user.passwordChangedAt?.getTime() / 1000 > payload.iat)
        return next(
          new AppError(
            "User password recently change, Please log in again",
            401
          )
        );
    }

    req.user = user;
    return next();
  }
);

export const isInvited = catchAsyncError(
  async (req: IGetUserEmailRequest, res: Response, next: NextFunction) => {
    const { token } = req.params;

    if (!token || typeof token !== "string")
      return next(new AppError("Invalid Token", 401));

    const payload = verifyJWT(token) as JwtPayload;

    const invitation = await Invitation.findOne({ token });

    if (payload?.email === invitation?.email) {
      req.email = payload?.email;
    } else {
      return next(new AppError("Invalid Token", 401));
    }

    next();
  }
);

export const isAdmin = catchAsyncError(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    if (req?.user?.isAdmin) {
      return next();
    }

    next(new AppError("This endpoint requires Admin rights", 401));
  }
);

export const forgotPassword = catchAsyncError(
  async (req: Request, res: ITokenResponse, next: NextFunction) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError("There is no user with email address.", 404));
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      token: resetToken,
    });
  }
);

export const resetPassword = catchAsyncError(
  async (req: Request, res: ITokenResponse, next: NextFunction) => {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    console.log(hashedToken);
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError("Token is invalid or has expired", 400));
    }
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    const token = generateAuthJWT(user._id);

    // after password reset, logout from all other places
    user.tokens = [{ token }];

    await user.save();

    res.status(200).json({
      token,
    });
  }
);
