const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');


// Các đường dẫn API
router.get('/occupied', verifyToken, roomController.getOccupiedRooms);
router.post('/', verifyToken, isAdmin, roomController.createRoom); 
router.get('/', verifyToken, roomController.getRooms); 
router.get('/:id', verifyToken, roomController.getRoomById); 
router.put('/:id', verifyToken, isAdmin, roomController.updateRoom); 
router.delete('/:id', verifyToken, isAdmin, roomController.deleteRoom); 



module.exports = router;