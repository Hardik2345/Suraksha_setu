const express = require('express');
const multer = require('multer');
const { isAuthenticated } = require('../../../../../middleware/auth');
const snapSosController = require('./snapSos.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }

    cb(null, true);
  },
});

function createSnapSOSRouter() {
  const router = express.Router();

  router.post('/analyze', isAuthenticated, upload.single('image'), snapSosController.analyze);
  router.post('/confirm', isAuthenticated, snapSosController.confirm);

  return router;
}

module.exports = { createSnapSOSRouter };
