/* assets/js/data/api.js
   Cliente HTTP unico contra /api. Todo el resto de la app pasa por acá. */

(function () {
    'use strict';

    async function apiRequest(path, { method = 'GET', body = null } = {}) {
        const options = {
            method,
            credentials: 'same-origin',
            headers: { 'Accept': 'application/json' }
        };

        if (body !== null) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }

        let res;
        try {
            res = await fetch(path, options);
        } catch {
            throw new Error('Sin conexión con el servidor.');
        }

        // La sesión venció mientras la pestaña estaba abierta. Se vuelve al
        // ingreso en vez de dejar la app mostrando datos viejos y fallando en
        // silencio con cada acción.
        if (res.status === 401) {
            const next = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.replace(`/login.html?next=${next}`);
            throw new Error('Sesión vencida.');
        }

        let payload = null;
        try {
            payload = await res.json();
        } catch {
            payload = null;
        }

        if (!res.ok) {
            const message = payload && payload.error ? payload.error : `Error ${res.status}`;
            throw new Error(message);
        }

        return payload;
    }

    // Postgres devuelve NUMERIC como string ("450000.00") y DATE puede llegar
    // como string o como Date segun el driver. Si esto no se normaliza acá,
    // calculateBalance termina concatenando texto en vez de sumar.
    function toNumber(value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    }

    function toDateString(value) {
        if (!value) return '';
        if (typeof value === 'string') return value.slice(0, 10);
        if (value instanceof Date) return value.toISOString().slice(0, 10);
        return String(value).slice(0, 10);
    }

    // Traduce una fila de la API a la forma que ya consume toda la UI
    // (categoría y subcategoría como NOMBRE). Los ids viajan igual, para que
    // el modal de edición pueda preseleccionar sin adivinar por nombre.
    function toUiTransaction(row) {
        return {
            id: row.id,
            type: row.type,
            name: row.name,
            amount: toNumber(row.amount),
            date: toDateString(row.date),
            category: row.categoryName || '',
            subcategory: row.subcategoryName || null,
            categoryId: row.categoryId,
            subcategoryId: row.subcategoryId,
            createdAt: row.createdAt
        };
    }

    window.api = {
        request: apiRequest,
        toUiTransaction,
        toNumber,

        getTransactions: () => apiRequest('/api/transactions'),
        createTransaction: (payload) => apiRequest('/api/transactions', { method: 'POST', body: payload }),
        updateTransaction: (id, payload) => apiRequest(`/api/transactions/${id}`, { method: 'PUT', body: payload }),
        deleteTransaction: (id) => apiRequest(`/api/transactions/${id}`, { method: 'DELETE' }),

        getCategories: () => apiRequest('/api/categories'),
        createCategory: (payload) => apiRequest('/api/categories', { method: 'POST', body: payload }),
        seedCategories: () => apiRequest('/api/categories/seed', { method: 'POST' }),

        getSettings: () => apiRequest('/api/settings'),
        putSetting: (key, value) => apiRequest('/api/settings', { method: 'PUT', body: { key, value } })
    };
})();
