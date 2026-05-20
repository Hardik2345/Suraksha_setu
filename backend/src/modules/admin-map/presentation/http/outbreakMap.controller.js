const outbreakMapService = require('../../application/outbreakMap.service');

exports.getOutbreakMap = async (req, res, next) => {
  try {
    const result = await outbreakMapService.getOutbreakMap(req.query);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
};
