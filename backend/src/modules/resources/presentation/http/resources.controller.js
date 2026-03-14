const resourcesService = require('../../application/resources.service');

exports.listResources = async (req, res, next) => {
  try {
    const result = await resourcesService.listResources(req.query);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
};

exports.getResource = async (req, res, next) => {
  try {
    const result = await resourcesService.getResource(req.params.id);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
};

exports.createResource = async (req, res, next) => {
  try {
    const result = await resourcesService.createResource(req.user, req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
};

exports.updateResource = async (req, res, next) => {
  try {
    const result = await resourcesService.updateResource(req.params.id, req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
};

exports.deleteResource = async (req, res, next) => {
  try {
    const result = await resourcesService.deleteResource(req.params.id);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
};
