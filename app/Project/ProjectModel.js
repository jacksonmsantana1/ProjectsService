const Joi = require('joi');

module.exports = Joi.object().keys({
  _id: Joi.any(),
  id: Joi.string().required(),
  name: Joi.string().required(),
});
