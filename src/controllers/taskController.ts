import Task, { ITask } from "../models/task";
import { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../utils/catchAsyncError";
import AppError from "../utils/appError";
import {
  IGetUserAuthInfoRequest,
  IPopulatedTaskArrayResponse,
  ITaskArrayResponse,
  ITaskResponse,
} from "../types";

export const createTask = catchAsyncError(
  async (req: Request, res: ITaskResponse, next: NextFunction) => {
    const task = new Task({ ...req.body, owner: (req as any).user.id });
    await task.save();

    return res.status(200).json(task);
  }
);

export const getTaskById = catchAsyncError(
  async (
    req: IGetUserAuthInfoRequest,
    res: ITaskResponse,
    next: NextFunction
  ) => {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req?.user?.id,
    });

    if (task) {
      return res.status(200).json(task);
    } else {
      return next(new AppError("Missing task or unauthorized access", 404));
    }
  }
);

export const updateTaskById = catchAsyncError(
  async (
    req: IGetUserAuthInfoRequest,
    res: ITaskResponse,
    next: NextFunction
  ) => {
    const updates = Object.keys(req.body || {});
    const allowedUpdates = ["description", "completed"];
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) return next(new AppError("Invalid Updates.", 400));

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user.id,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!task) {
      return next(new AppError("Missing task or unauthorized access", 404));
    }

    return res.send(task);
  }
);

export const deleteTaskById = catchAsyncError(
  async (
    req: IGetUserAuthInfoRequest,
    res: ITaskResponse,
    next: NextFunction
  ) => {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!task) {
      return next(new AppError("Missing task or unauthorized access", 404));
    }

    return res.send(task);
  }
);

export const getUserTasks = catchAsyncError(
  async (
    req: IGetUserAuthInfoRequest,
    res: IPopulatedTaskArrayResponse,
    next: NextFunction
  ) => {
    const tasks = (await req.user.populate("tasks"))?.tasks;
    res.json(tasks);
  }
);

export const getAllTasks = catchAsyncError(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    const filters = { ...(req?.query || {}) };
    const allowedFilterFields = ["completed", "owner"];

    const findFilters = Object.fromEntries(
      Object.entries(filters).filter(([key]) =>
        allowedFilterFields.includes(key)
      )
    );

    let query = Task.find(findFilters);

    query = query?.skip(parseInt(filters?.offset as string, 10) || 0);
    query = query?.limit(parseInt(filters?.limit as string, 10) || 0);

    const tasks = await query;

    res.json(tasks);
  }
);
