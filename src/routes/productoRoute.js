const express = require('express');
const { poblarProductos } = require('../controllers/externalController');
const router = express.Router();

router.post('/poblar', poblarProductos);

module.exports = router;