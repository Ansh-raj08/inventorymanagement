function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode >= 400 ? res.statusCode : 500;
  let message = err.message || "Server error";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  } else if (err.name === "CastError" || err instanceof require("mongoose").Error.CastError) {
    statusCode = 400;
    message = "Invalid product ID or value";
  } else if (err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyValue || {})[0] || "field";
    message = `${duplicateField} already exists`;
  } else if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON request body";
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {})
  });
}

module.exports = { notFound, errorHandler };
