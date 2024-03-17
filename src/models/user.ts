import { Schema, model, Model, HydratedDocument } from "mongoose";
import bcrypt from "bcrypt";
import AppError from "../utils/appError";
const validator = require("validator");

export interface IToken {
  token: String;
}

export interface IUser {
  name: String;
  email: String;
  password: String;
  tokens: IToken[];
  isAdmin: boolean;
  passwordChangedAt?: Date;
  passwordResetToken?: String;
  passwordResetExpires?: Date;
}

export interface IUserModel extends Model<IUser> {
  getUserByCredentials(
    email: String,
    password: String
  ): HydratedDocument<IUser, IUserModel>;
}

export const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, "Name must be provided for the User."],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email must be provided for the User"],
    validate: [validator.isEmail, `{VALUE} is not a valid email address.`],
    unique: true,
  },
  password: {
    type: String,
    minlength: [8, "User password must be atleast 8 characters long."],
    trim: true,
    required: true,
    select: false,
  },
  tokens: [{ token: { type: String, select: false } }],
  isAdmin: { type: Boolean },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.virtual("tasks", {
  ref: "task",
  foreignField: "owner",
  localField: "_id",
});

userSchema.static("getUserByCredentials", async function (email, password) {
  const user = await User.findOne({ email }).select("+password");

  if (!user) throw new AppError("Unable to login.", 401);

  const isValidUser = await bcrypt.compare(password, user.password as string);
  if (!isValidUser) throw new AppError("Unable to login.", 401);

  return user;
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    try {
      const salt = await bcrypt.genSalt(8);
      this.password = await bcrypt.hash(this.password as string, salt);
      this.passwordChangedAt = new Date(Date.now());
      next();
    } catch (e) {
      throw e;
    }
  }

  next();
});

const User = model<IUser, IUserModel>("user", userSchema);
export default User;
