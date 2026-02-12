const express = require('express');
const { poblarProductos, obtenerProductos, obtenerProducto } = require('../controllers/externalController');
const router = express.Router();

router.post('/poblar', poblarProductos);

router.get('/obtener', obtenerProductos);

router.get('/:nombre', obtenerProducto);
module.exports = router;