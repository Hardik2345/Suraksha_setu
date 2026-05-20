const geocodingService = require('../../application/geocoding.service');

exports.reverseGeocode = async (req, res, next) => {
  try {
    const result = await geocodingService.reverseGeocode(req.query);
    res.status(result.status).json(result.body);
  } catch (error) {
    next(error);
  }
};
