const pool = require('../config/db');

const crearProducto = async (request, response) => {
    const { nombre, precio, stock, descripcion, imagen_url, categoria, youtube_id } = request.body;
    if (!nombre) {
        return response.status(400).json({ error: 'El campo "nombre" es obligatorio' });
    }
    if (!precio) {
        return response.status(400).json({ error: 'El campo "precio" es obligatorio' });
    }
    if (!categoria) {
        return response.status(400).json({ error: 'El campo "categoria" es obligatorio' });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Insertar o buscar categoría
        const query = `
            INSERT INTO categoria (nombre)
            VALUES ($1)
            ON CONFLICT ON CONSTRAINT categoria_nombre_unique
            DO NOTHING
            RETURNING id;
        `;
        let categoriaResult = await client.query(query, [categoria]);

        let categoryId;
        if (categoriaResult.rows.length > 0) {
            categoryId = categoriaResult.rows[0].id;
        }
        else {
            const selectCategoria = `
                SELECT id FROM categoria WHERE nombre = $1
            `;
            const existing = await client.query(selectCategoria, [categoria]);
            categoryId = existing.rows[0].id;
        }
        
        // Insertar el producto
        const productoQuery = `
            INSERT INTO productos (nombre, precio, stock, descripcion, imagen_url, id_categoria, youtube_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        
        const productoResult = await client.query(productoQuery, [
            nombre,
            precio,
            stock || 0,
            descripcion || '',
            imagen_url || '',
            categoryId,
            youtube_id || null
        ]);
        
        await client.query('COMMIT');
        
        response.status(201).json({
            mensaje: 'Producto creado exitosamente',
            producto: productoResult.rows[0]
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al crear producto:', error);
        response.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

const obtenerProductoById = async (request, response) => {
   const { id } = request.params;
   try {
    const query = `select p.id, p.nombre, p.precio, p.stock, p.descripcion, p.imagen_url, p.youtube_id, c.nombre as categoria
        from productos p
        join categoria c on p.id_categoria = c.id
        where p.id = $1`;
        const result = await pool.query(query, [id]);
        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Producto no encontrado' });
        }
        response.status(200).json(result.rows[0]);
   } catch (error) {
        console.log(`Error: ${error}`);
        response.status(500).json({error: error.message})
   }
};

const obtenerProductos = async (request, response) => {
    try {
        const query = `select p.id, p.nombre, p.precio, p.stock, p.descripcion, p.imagen_url, p.youtube_id, c.nombre as categoria
        from productos p
        join categoria c on p.id_categoria = c.id`;
        const result = await pool.query(query);
        response.status(200).json(result.rows);
    } catch (error) {
        console.log(`Error: ${error}`);
        response.status(500).json({error: error.message})
    }
};

const obtenerCategoria = async (request, response) => {
    const { categoria } = request.params;
    try {
        const { rows, rowCount } = await pool.query(
            `SELECT *
                FROM productos
                WHERE id_categoria IN (
                    SELECT id
                    FROM categoria
                    WHERE nombre ILIKE $1
                );`,
            [`%${categoria}%`]
        );

         if (rowCount === 0) {
            return response.status(404).json({ error: 'Categoría no encontrada' });
        }
        response.status(200).json(rows);

    } catch(error){
        console.error(error);
        return response.status(500).json({error: error.message});
    }
}
const obtenerProducto = async (request, response) => {
    const { nombre } = request.params;

    try {
        const { rows, rowCount } = await pool.query(
            `SELECT * FROM productos WHERE nombre ILIKE $1;`,
            [`%${nombre}%`]
        );

         if (rowCount === 0) {
            return response.status(404).json({ error: 'Producto no encontrado' });
        }
        response.status(200).json(rows);

    } catch(error){
        console.error(error);
        return response.status(500).json({error: error.message});
    }

    
}

const buscarProductos = async (request, response) => {
    const { q } = request.query;

    if (!q || q.trim() === '') {
        return response.status(400).json({ 
            error: 'Bad Request', 
            mensaje: 'El parámetro de búsqueda "q" es requerido' 
        });
    }

    try {
        const query = `
            SELECT p.id, p.nombre, p.precio, p.stock, p.descripcion, p.imagen_url, p.youtube_id, c.nombre as categoria
            FROM productos p
            JOIN categoria c ON p.id_categoria = c.id
            WHERE p.nombre ILIKE $1 OR p.descripcion ILIKE $1
            ORDER BY p.nombre;
        `;

        const { rows, rowCount } = await pool.query(query, [`%${q}%`]);

        response.status(200).json({
            cantidad: rowCount,
            resultados: rows
        });

    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: error.message });
    }
};

module.exports = {crearProducto, obtenerProductoById, obtenerProductos, obtenerCategoria, obtenerProducto, buscarProductos };