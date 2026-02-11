const pool = require('../config/db');

const poblarProductos = async (request, response) => {
    try {
        // Fetch FakeStoreApi
        const apiFetch = await fetch('http://fakestoreapi.com/products');
        const products = await apiFetch.json();

        let inserciones = 0;
        // Destructurar el objeto
        for(const product of products){
            const { title, price, description, image, category} = product;

            const stock = Math.floor(Math.random() * 50) + 1;

            const categoryQueryCheck = `
                SELECT id FROM categoria WHERE nombre = $1
            `
            const categoryResult = await pool.query(categoryQueryCheck, [category]);

            if(categoryResult.rows.length > 0){
                const categoryId = categoryResult.rows[0].id;
                const query = `
                    INSERT INTO productos
                (nombre, precio, stock, descripcion, imagen_url, id_categoria)
                VALUES ($1, $2, $3, $4, $5, $6)
            `
                await pool.query(query, [title, price, stock, description, image, categoryId]);
            } else {
                const insertCategoryQuery = `
                    INSERT INTO categoria (nombre) VALUES ($1) RETURNING id
                `
                const newCategoryResult = await pool.query(insertCategoryQuery, [category]);
                const newCategoryId = newCategoryResult.rows[0].id;

                const query = `
                    INSERT INTO productos
                (nombre, precio, stock, descripcion, imagen_url, id_categoria)
                VALUES ($1, $2, $3, $4, $5, $6)
            `
                await pool.query(query, [title, price, stock, description, image, newCategoryId]);
            }

        inserciones++;
    }
    response.status(200).json(
        {
                mensaje: "Carga masiva exitosa", 
                cantidad: inserciones
            }
        );
    } catch (error) {
        console.log(`Error: ${error}`);
        response.status(500).json({error: error.message})
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

module.exports = { poblarProductos, obtenerProductos };