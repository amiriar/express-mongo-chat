import Joi from "@hapi/joi";
import createError from "http-errors";

export const updateUserSchema = Joi.object({
  firstname: Joi.string()
    .min(2)
    .max(30)
    .optional()
    .allow("", null)
    .empty()
    .error(
      createError.BadRequest("First name must be between 2 and 30 characters")
    ),
  lastname: Joi.string()
    .min(2)
    .max(30)
    .optional()
    .allow("", null)
    .empty()
    .error(
      createError.BadRequest("Last name must be between 2 and 30 characters")
    ),
  username: Joi.string()
    .pattern(/^[a-zA-Z0-9\/\-\_\+\@]+$/)
    .min(3)
    .max(30)
    .optional()
    .allow("", null)
    .empty()
    .error(
      createError.BadRequest(
        "Username must be between 3 and 30 characters and can contain alphanumeric characters and / - _ + @"
      )
    ),

  email: Joi.string()
    .email()
    .optional()
    .empty()
    .allow("", null)
    .error(createError.BadRequest("Invalid email address")),
  phoneNumber: Joi.string()
    .min(11)
    .max(11)
    .pattern(/^[0-9]+$/, "numbers")
    .optional()
    .allow("", null)
    .empty()
    .error(createError.BadRequest("Phone number must contain only numbers")),
  profile: Joi.string()
    .optional()
    .allow("", null)
    .empty()
    .error(createError.BadRequest("Profile must be a valid URL")),
  bio: Joi.string()
    .optional()
    .min(0)
    .max(75)
    .allow("", null)
    .empty()
    .error(createError.BadRequest("Invalid bio")),
  fileUploadPath: Joi.string().optional(),
  filename: Joi.string().optional(),
  // id: Joi.any().required(),
});
