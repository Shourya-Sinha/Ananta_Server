import Joi from "joi";

export const createSiteSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  address: Joi.string().min(5).max(200).required(),
});

export const updateSiteSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  address: Joi.string().min(5).max(200).optional(),
  id:Joi.string().required()
});