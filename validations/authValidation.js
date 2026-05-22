import Joi from "joi";

export const loginSchema = Joi.object({
  phone: Joi.string().optional(),
  email:Joi.string().email().optional(),
  password: Joi.string().required(),
});

export const registerSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().required(),
  role: Joi.string().valid("admin", "worker").required(),
  dailyRate: Joi.number().default(0),
  site: Joi.string().optional(),
}).unknown(true);

export const forgotSchema = Joi.object({
  phone: Joi.string().required(),
});

export const resetSchema = Joi.object({
  phone: Joi.string().required(),
  otp: Joi.string().required(),
  newPassword: Joi.string().required(),
});

export const senOTPSchema = Joi.object({
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
}).or("phone", "email");



export const verifyOTPSchema = Joi.object({
  otp: Joi.string().required(),
  email: Joi.string().email().optional(),
});