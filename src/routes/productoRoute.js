const express = require('express');
const { poblarProductos, obtenerProductos } = require('../controllers/externalController');
const router = express.Router();

router.post('/poblar', poblarProductos);

router.get('/obtener', obtenerProductos);
module.exports = router;