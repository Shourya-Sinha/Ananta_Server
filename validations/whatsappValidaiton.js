import Joi from "joi";

export const whatsappSchema = Joi.object({
  phone: Joi.string().required(),
  message: Joi.string().required(),
});