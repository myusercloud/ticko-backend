const ApiError = require('../utils/ApiError');

const validateRequest = (schema) => (req, res, next) => {
  try {
    const data = {
      body: req.body,
      params: req.params,
      query: req.query,
    };
    schema.parse(data);
    return next();
  } catch (err) {
    if (err.errors) {
      const first = err.errors[0];
      const message = first.message || 'Invalid request';
      return next(new ApiError(400, message));
    }
    return next(new ApiError(400, 'Invalid request'));
  }
};

module.exports = validateRequest;

