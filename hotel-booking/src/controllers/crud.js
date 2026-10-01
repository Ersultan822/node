const { asyncHandler, pickFilter, HttpError } = require('../utils/helpers');

// Қарапайым CRUD контроллерін жасайтын фабрика
module.exports = (Model, { filterFields = [], populate = '' } = {}) => ({
  list: asyncHandler(async (req, res) => {
    const items = await Model.find(pickFilter(req.query, filterFields)).populate(populate).sort('-createdAt');
    res.json({ success: true, count: items.length, data: items });
  }),
  get: asyncHandler(async (req, res) => {
    const item = await Model.findById(req.params.id).populate(populate);
    if (!item) throw new HttpError(404, `${Model.modelName} табылмады`);
    res.json({ success: true, data: item });
  }),
  create: asyncHandler(async (req, res) => {
    const item = await Model.create(req.body);
    res.status(201).json({ success: true, data: item });
  }),
  update: asyncHandler(async (req, res) => {
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) throw new HttpError(404, `${Model.modelName} табылмады`);
    res.json({ success: true, data: item });
  }),
  remove: asyncHandler(async (req, res) => {
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) throw new HttpError(404, `${Model.modelName} табылмады`);
    res.json({ success: true, message: `${Model.modelName} жойылды` });
  }),
});
