import Joi from "@hapi/joi";
import createError from "http-errors";

export const updateUserSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(30)
    .optional()
    .allow("", null)
    .empty()
    .error(createError.BadRequest("First name must be between 2 and 30 characters")),
  lastName: Joi.string()
    .min(2)
    .max(30)
    .optional()
    .allow("", null)
    .empty()
    .error(createError.BadRequest("Last name must be between 2 and 30 characters")),
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .optional()
    .allow("", null)
    .empty()
    .error(createError.BadRequest("Username must be between 3 and 30 characters and alphanumeric")),
  email: Joi.string()
    .email()
    .optional()
    .empty()
    .allow("", null)
    .error(createError.BadRequest("Invalid email address")),
  age: Joi.number()
    .integer()
    .min(0)
    .max(100)
    .optional()
    .allow(null)
    .empty()
    .error(createError.BadRequest("Age must be a non-negative integer")),
  job: Joi.string()
    .optional()
    .allow("", null)
    .empty()
    .error(createError.BadRequest("Invalid job description")),
  phoneNumber: Joi.string()
    .min(11)
    .max(11)
    .pattern(/^[0-9]+$/, "numbers")
    .optional()
    .allow("", null)
    .empty()
    .error(createError.BadRequest("Phone number must contain only numbers")),
  education: Joi.string()
    .optional()
    .allow("", null)
    .empty()
    .error(createError.BadRequest("Invalid education description")),
  isStudent: Joi.boolean()
    .optional()
    .allow(null)
    .empty()
    .error(createError.BadRequest("IsStudent must be a boolean")),
  profile: Joi.string()
    .optional()
    .allow("", null)
    .empty()
    .error(createError.BadRequest("Profile must be a valid URL")),
  description: Joi.string()
    .optional()
    .allow("", null)
    .empty()
    .error(createError.BadRequest("Invalid description")),
  linkedin: Joi.string()
    .optional()
    .allow("", null, "#")
    .uri()
    .default("#")
    .error(createError.BadRequest("LinkedIn URL must be valid")),
  pinterest: Joi.string()
    .optional()
    .allow("", null, "#")
    .uri()
    .default("#")
    .error(createError.BadRequest("Pinterest URL must be valid")),
  twitterX: Joi.string()
    .optional()
    .allow("", null, "#")
    .uri()
    .default("#")
    .error(createError.BadRequest("Twitter URL must be valid")),
  facebook: Joi.string()
    .optional()
    .allow("", null, "#")
    .uri()
    .default("#")
    .error(createError.BadRequest("Facebook URL must be valid")),
  fileUploadPath: Joi.string().optional(),
  filename: Joi.string().optional(),
  id: Joi.any().required(),
});
