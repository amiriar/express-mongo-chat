import Joi from "@hapi/joi";
import createError from "http-errors";

export const registerSchema = Joi.object({
    phone: Joi.string().min(11).max(11).error(createError.BadRequest("شماره تلفن وارد شده صحیح نمیباشد.")),
});

export const loginSchema = Joi.object({
    phone: Joi.string().min(11).max(11).error(createError.BadRequest("شماره تلفن وارد شده صحیح نمیباشد.")),
    otp: Joi.number().min(5).max(5).error(createError.BadRequest("کد وارد شده صحیح نمیباشد")),
});
