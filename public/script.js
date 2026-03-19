const API_URL = 'http://localhost:4000/api/productos';
const AUTH_URL = 'http://localhost:4000/api/auth';

// Elementos del DOM
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const mainContainer = document.getElementById('mainContainer');

const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const loading = document.getElementById('loading');
const noResults = document.getElementById('noResults');
const productTable = document.getElementById('productTable');
const tableBody = document.getElementById('tableBody');
const stats = document.getElementById('stats');
const searchTerm = document.getElementById('searchTerm');

// Verificar si ya hay token al cargar
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        mostrarApp();
        cargarTodosProductos();
    }
});

// Manejar login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    loginBtn.disabled = true;
    loginBtn.textContent = 'Iniciando sesión...';
    loginError.classList.remove('show');
    
    try {
        const response = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.msg || 'Error al iniciar sesión');
        }
        
        // Guardar token
        localStorage.setItem('token', data.token);
        
        // Mostrar app
        mostrarApp();
        cargarTodosProductos();
        
    } catch (error) {
        loginError.textContent = error.message;
        loginError.classList.add('show');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Iniciar Sesión';
    }
});

// Manejar logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    ocultarApp();
});

function mostrarApp() {
    loginModal.style.display = 'none';
    mainContainer.style.display = 'block';
}

function ocultarApp() {
    loginModal.style.display = 'flex';
    mainContainer.style.display = 'none';
    loginForm.reset();
    loginError.classList.remove('show');
}

async function fetchJSON(url) {
    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
    });

    if (!res.ok) {
        let msg = `Error ${res.status}`;
        try {
            const data = await res.json();
            msg = data.mensaje || msg;
        } catch {}
        throw new Error(msg);
    }

    return res.json();
}

function debounce(fn, delay = 500) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function crearCelda(texto, clase = '') {
    const td = document.createElement('td');
    td.textContent = texto;
    if (clase) td.className = clase;
    return td;
}

function showLoading() {
    loading.style.display = 'block';
    productTable.style.display = 'none';
    noResults.style.display = 'none';
}

function hideLoading() {
    loading.style.display = 'none';
}

function mostrarError(mensaje) {
    productTable.style.display = 'none';
    noResults.style.display = 'none';
    stats.innerHTML = `<span style="color:#e74c3c;">⚠️ ${mensaje}</span>`;
}

function mostrarSinResultados(query) {
    productTable.style.display = 'none';
    stats.textContent = '';
    searchTerm.textContent = `"${query}"`;
    noResults.style.display = 'block';
}

function hideNoResults() {
    noResults.style.display = 'none';
}

function mostrarProductos(productos) {
    hideNoResults();
    productTable.style.display = 'table';
    tableBody.innerHTML = '';

    if (!productos?.length) {
        stats.textContent = 'No hay productos para mostrar';
        return;
    }

    productos.forEach(producto => {
        const row = document.createElement('tr');

        row.append(
            crearCelda(producto.nombre),
            crearCelda(producto.descripcion, 'descripcion'),
            crearCelda(producto.categoria),
            crearCelda(`$${Number(producto.precio).toFixed(2)}`, 'precio'),
            crearCelda(producto.stock, 'stock')
        );

        tableBody.appendChild(row);
    });
}

async function cargarTodosProductos() {
    try {
        showLoading();

        const productos = await fetchJSON(`${API_URL}`);

        mostrarProductos(productos);
        stats.textContent = `Mostrando ${productos.length} productos`;

    } catch (err) {
        console.error(err);
        mostrarError('No se pudieron cargar los productos.');
    } finally {
        hideLoading();
    }
}

async function buscarProductos(query) {
    if (!query.trim()) return cargarTodosProductos();

    try {
        showLoading();

        const data = await fetchJSON(`${API_URL}/buscar?q=${encodeURIComponent(query)}`);

        if (!data.cantidad) return mostrarSinResultados(query);

        mostrarProductos(data.resultados);
        stats.textContent =
            `Se encontraron ${data.cantidad} producto${data.cantidad !== 1 ? 's' : ''}`;

    } catch (err) {
        console.error(err);
        mostrarError('Error al realizar la búsqueda.');
    } finally {
        hideLoading();
    }
}

searchInput.addEventListener('input', debounce(e => {
    const query = e.target.value;
    clearBtn.disabled = !query;
    buscarProductos(query);
}));

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.disabled = true;
    stats.textContent = '';
    hideNoResults();
    cargarTodosProductos();
});

searchInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
        buscarProductos(e.target.value);
    }
});

// cargarTodosProductos(); // Se carga automáticamente después del login
