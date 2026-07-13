const express = require('express');
const router = express.Router();
const { createRequest } = require('../controllers/maintenance.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/', verifyToken, createRequest);

module.exports = router;