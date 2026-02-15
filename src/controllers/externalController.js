const { request } = require('express');
const pool = require('../config/db');

const poblarProductos = async (request, response) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const apiFetch = await fetch('https://fakestoreapi.com/products');
        const products = await apiFetch.json();

        let inserciones = 0;

        for (const product of products) {
            const { title, price, description, image, category } = product;
            const stock = Math.floor(Math.random() * 50) + 1;

            const categoriaQuery = `
                INSERT INTO categoria (nombre)
                VALUES ($1)
                ON CONFLICT ON CONSTRAINT categoria_nombre_unique
                DO NOTHING
                RETURNING id;
            `;

            let categoriaResult = await client.query(categoriaQuery, [category]);

            let categoryId;

            if (categoriaResult.rows.length > 0) {
                categoryId = categoriaResult.rows[0].id;
            } else {
                const selectCategoria = `
                    SELECT id FROM categoria WHERE nombre = $1
                `;
                const existing = await client.query(selectCategoria, [category]);
                categoryId = existing.rows[0].id;
            }

            const productoQuery = `
                INSERT INTO productos
                (nombre, precio, stock, descripcion, imagen_url, id_categoria)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;

            await client.query(productoQuery, [
                title,
                price,
                stock,
                description,
                image,
                categoryId
            ]);

            inserciones++;
        }

        await client.query('COMMIT');

        response.status(200).json({
            mensaje: "Carga masiva exitosa",
            cantidad: inserciones
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        response.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};




const obtenerProductos = async (request, response) => {
    try {
        const query = `select p.id, p.nombre, p.precio, p.stock, p.descripcion, p.imagen_url, c.nombre as categoria
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
            SELECT p.id, p.nombre, p.precio, p.stock, p.descripcion, p.imagen_url, c.nombre as categoria
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

module.exports = { poblarProductos, obtenerProductos, obtenerCategoria, obtenerProducto, buscarProductos };