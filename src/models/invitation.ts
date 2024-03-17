import { Schema, model } from "mongoose";
const validator = require("validator");

interface IInvitation {
  email: String;
  token: String;
  valid: Boolean;
}

const invitationSchema = new Schema<IInvitation>({
  email: {
    type: String,
    required: [true, "Email must be provided to invite a new User"],
    validate: [validator.isEmail, `{VALUE} is not a valid email address.`],
    unique: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  valid: { type: Boolean, required: true },
});

const Invitation = model<IInvitation>("invitation", invitationSchema);
export default Invitation;
