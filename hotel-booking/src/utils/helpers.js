class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Тек рұқсат етілген өрістерден сүзгі жасау (NoSQL injection-нан қорғау)
const pickFilter = (query, fields) => {
  const filter = {};
  for (const f of fields) {
    if (typeof query[f] === 'string' && query[f] !== '') filter[f] = query[f];
  }
  return filter;
};

const parseDates = (checkIn, checkOut) => {
  const inD = new Date(checkIn);
  const outD = new Date(checkOut);
  if (isNaN(inD) || isNaN(outD)) throw new HttpError(400, 'checkIn және checkOut дұрыс күн болуы керек (YYYY-MM-DD)');
  if (outD <= inD) throw new HttpError(400, 'checkOut күні checkIn күнінен кейін болуы керек');
  return { inD, outD };
};

const countNights = (inD, outD) => Math.ceil((outD - inD) / 86400000);

module.exports = { HttpError, asyncHandler, escapeRegex, pickFilter, parseDates, countNights };
