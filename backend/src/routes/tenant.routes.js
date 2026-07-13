const express = require('express');
const router = express.Router();
const { createTenant, getTenants, deleteTenant, updateTenant } = require('../controllers/tenant.controller');
const { verifyToken } = require('../middlewares/auth.middleware');


router.put('/:id', verifyToken, updateTenant); // Thêm dòng này
router.delete('/:id', verifyToken, deleteTenant);
router.post('/', verifyToken, createTenant);
router.get('/', verifyToken, getTenants);

module.exports = router;


