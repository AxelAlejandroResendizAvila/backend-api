const express = require('express');
const { poblarProductos } = require('../controllers/externalController');
const { crearProducto, obtenerProductoById, obtenerProductos, obtenerCategoria, obtenerProducto, buscarProductos  } = require('../controllers/productoController');

const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/poblar', authMiddleware, poblarProductos);

router.post('/crear', authMiddleware, crearProducto);

router.get('/', authMiddleware, obtenerProductos);

router.get('/buscar', authMiddleware, buscarProductos);

router.get('/categoria/:categoria', authMiddleware, obtenerCategoria);

router.get('/producto/:nombre', authMiddleware, obtenerProducto);

// Ruta dinámica al final para evitar conflictos
router.get('/:id', authMiddleware, obtenerProductoById);

module.exports = router;