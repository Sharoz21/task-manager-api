const validator = require("validator");

//used type predicate
export const isValidEmail = (email: unknown): email is string => {
  return email && typeof email === "string" && validator.isEmail(email);
};
