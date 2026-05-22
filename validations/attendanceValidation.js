import Joi from "joi";

export const markAttendanceSchema = Joi.object({
  workerId: Joi.string().required(),
  status: Joi.string().valid(
    "absent",
    "P", "P1", "P2", "P3", "P4", "P5", "P6","P7","P8", "P9", "P10", "P11", "P12", "P13", "P14","P16","P18","P18"
  ).required(),
  siteId: Joi.string().optional()
});