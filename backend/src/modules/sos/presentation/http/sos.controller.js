const sosService = require('../../application/sos.service');

exports.listSOS = async (req, res, next) => {
  try {
    const result = await sosService.listSOSForUser(req.user, req.query);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
};

exports.createSOS = async (req, res, next) => {
  try {
    const result = await sosService.createSOSForUser(req.user, req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
};

exports.viewSOS = async (req, res, next) => {
  try {
    const result = await sosService.viewSOSForUser(req.user, req.params.id);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const result = await sosService.updateSOSStatus(req.params.id, req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
};
