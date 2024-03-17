import { IUser } from "../models/user";
import { Request, Response } from "express";
import { HydratedDocument, Model, Document, Types } from "mongoose";
import { ITask } from "../models/task";

type User = Document<unknown, {}, IUser> &
  IUser & {
    _id: Types.ObjectId;
  } & {};

interface IReqUser extends User {
  tasks?: HydratedDocument<typeof Model<ITask>>[];
}

export interface IGetUserAuthInfoRequest extends Request {
  user: IReqUser;
}

export interface IGetUserEmailRequest extends Request {
  email: string;
}

type Task = Document<unknown, {}, ITask> &
  ITask & {
    _id: Types.ObjectId;
  };

export type IPopulatedTask =
  | (Document<unknown, {}, typeof Model<ITask>> &
      typeof Model<ITask> & { _id: Types.ObjectId })[]
  | undefined;

export type ITaskResponse = Response<Task>;
export type ITaskArrayResponse = Response<Task[]>;
export type IPopulatedTaskArrayResponse = Response<IPopulatedTask>;
