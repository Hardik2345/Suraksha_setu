const snapSosService = require('../../application/snapSos.service');

exports.analyze = async (req, res, next) => {
  try {
    const result = await snapSosService.analyzeSnapSOS(req.user, req.body, req.file, req);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
};

exports.confirm = async (req, res, next) => {
  try {
    const result = await snapSosService.confirmSnapSOS(req.user, req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
};
