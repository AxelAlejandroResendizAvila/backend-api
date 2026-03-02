const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const register = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userExist = await pool.query('SELECT * FROM USUARIOS WHERE email = $1', [email])
        if (userExist.rowCount > 0) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            'INSERT INTO USUARIOS (email, password) VALUES ($1, $2) RETURNING *',
            [email, passwordHash]
        );
        res.status(201).json({
            msg: 'Usuario registrado con éxito',
            user: newUser.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }

}

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM USUARIOS WHERE email = $1', [email]);
        if (result.rowCount === 0) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }
        
        const usuario = result.rows[0];
        const isMatch = await bcrypt.compare(password, usuario.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        const playload = { 
            id: usuario.id,
            rol: usuario.rol,
            email: usuario.email
        };

        const token = jwt.sign(
            playload, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' 

        });
        res.status(200).json({
            msg: 'Login exitoso',
            token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};


module.exports = { register, login };