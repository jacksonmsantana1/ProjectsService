const Joi = require('joi');

module.exports = Joi.object().keys({
  _id: Joi.any().optional(),
  id: Joi.string().required(),
  name: Joi.string().required(),
  author: Joi.string().required(),
  type: Joi.string().required(),
  creationDate: Joi.date().min('1-1-2016'),
  lastUpdateDate: Joi.date().min('1-1-2016'),
  svgDescription: Joi.string(),
  svgProject: Joi.string(),
  images: Joi.object({
    doneByUsers: Joi.array(),
    doneByAuthor: Joi.array(),
    templates: Joi.array(),
  }),
  liked: Joi.array().unique(),
});
