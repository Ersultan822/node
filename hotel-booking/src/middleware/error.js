const notFound = (req, res) =>
  res.status(404).json({ success: false, message: `Маршрут табылмады: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Серверлік қате';
  let details;

  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Валидация қатесі';
    details = Object.values(err.errors).map((e) => e.message);
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Жарамсыз мән: ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    message = `Қайталанатын мән: ${Object.keys(err.keyValue || {}).join(', ')}`;
  }

  if (status === 500) console.error(err);
  res.status(status).json({ success: false, message, ...(details && { details }) });
};

module.exports = { notFound, errorHandler };
