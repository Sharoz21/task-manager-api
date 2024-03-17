import { Schema, model } from "mongoose";

export interface ITask {
  description: String;
  completed: Boolean;
  owner: Schema.Types.ObjectId;
}

export const taskSchema = new Schema<ITask>({
  description: {
    type: String,
    trim: true,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  owner: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "user",
  },
});

const Task = model<ITask>("task", taskSchema);
export default Task;
