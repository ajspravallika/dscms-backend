const { validationResult } = require('express-validator');
const { error } = require('../utils/apiResponse');

/**
 * Runs after an array of express-validator checks declared on a route.
 * If any check failed, responds with 422 and a structured error list
 * instead of letting the request reach the controller.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return error(res, 422, 'Validation failed', formatted);
  }

  next();
};

module.exports = { validate };
