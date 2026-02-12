const express = require('express');
const { poblarProductos, obtenerProductos, obtenerCategoria, obtenerProducto } = require('../controllers/externalController');
const router = express.Router();

router.post('/poblar', poblarProductos);

router.get('/obtener', obtenerProductos);

router.get('/categoria/:categoria', obtenerCategoria)

router.get('/producto/:nombre', obtenerProducto);

module.exports = router;