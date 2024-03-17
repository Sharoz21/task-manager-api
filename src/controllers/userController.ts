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
    /* 
    #swagger.summary = 'Create new user with invite token'
    #swagger.tags = ['Users'] 
    #swagger.summary = 'Get All Tasks of current user'
    #swagger.parameters = [{ 
            "name": "authorization",
            "in": "header",
            "type": "string",
            "required": true,
            "schema": {"type":"string", "format":"jwt", "example":"Bearer your_token_here"},
    }]
      #swagger.responses[200] = {
            description: 'Public info for created User',
            schema: { $ref: '#/definitions/PublicUserInfo' }
      }
      #swagger.responses[500] = {
        description: 'Something went wrong',
        schema: {status: "string", message: "string"}
      }
    
    */
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
    /* #swagger.tags = ['Users'] 
    #swagger.summary = 'Log in user'
    #swagger.parameters = [{ 
            "name": "authorization",
            "in": "header",
            "type": "string",
            "required": true,
            "schema": {"type":"string", "format":"jwt", "example":"Bearer your_token_here"},
    }]
      #swagger.responses[200] = {
            description: 'Auth token for logged in user',
            schema: { "token": "string" }
      }
      #swagger.responses[500] = {
         description: 'Something went wrong',
        schema: {status: "string", message: "string"}
      }
       
    */
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
    /* #swagger.tags = ['Users'] 
    #swagger.summary = 'Log out current user'
    #swagger.parameters = [{ 
            "name": "authorization",
            "in": "header",
            "type": "string",
            "required": true,
            "schema": {"type":"string", "format":"jwt", "example":"Bearer your_token_here"},
    }]
      #swagger.responses[200] = {
            description: 'Message on login success',
            schema: { "message": "string" }
      }
      #swagger.responses[500] = {
       description: 'Something went wrong',
        schema: {status: "string", message: "string"}
      }
    
    */
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
    /* 
    #swagger.tags = ['Users']
    #swagger.summary = 'Update current user's info (for passwords, use reset password endpoint)' 
    #swagger.parameters = [{ 
            "name": "authorization",
            "in": "header",
            "type": "string",
            "required": true,
            "schema": {"type":"string", "format":"jwt", "example":"Bearer your_token_here"},
    }]
      #swagger.responses[200] = {
            description: 'Updated current user public info',
            schema: { $ref: '#/definitions/PublicUserInfo' }
      }
      #swagger.responses[500] = {
         description: 'Something went wrong',
        schema: {status: "string", message: "string"}
      }
      
    */
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
    /* 
    #swagger.tags = ['Users'] 
    #swagger.summary = 'Generate invite token (accessible only for admin users)'
    #swagger.parameters = [{ 
            "name": "authorization",
            "in": "header",
            "type": "string",
            "required": true,
            "schema": {"type":"string", "format":"jwt", "example":"Bearer your_token_here"},
    }]
      #swagger.responses[200] = {
            description: 'token generated for User invite',
            schema: { "token":"string" }
      }
      #swagger.responses[500] = {
         description: 'Something went wrong',
        schema: {status: "string", message: "string"}
      }
    
    */
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
    /* 
    #swagger.tags = ['Users'] 
    #swagger.summary = 'Get public info of current user'
    #swagger.parameters = [{ 
            "name": "authorization",
            "in": "header",
            "type": "string",
            "required": true,
            "schema": {"type":"string", "format":"jwt", "example":"Bearer your_token_here"},
    }]
      #swagger.responses[200] = {
            description: 'Get current user public info',
            schema: { $ref: '#/definitions/PublicUserInfo' }
      }
      #swagger.responses[500] = {
        description: 'Something went wrong',
        schema: {status: "string", message: "string"}
      }
      
    */
    const user = await User.findById(req?.user?.id).select("name email");

    return res.status(200).json(user);
  }
);
