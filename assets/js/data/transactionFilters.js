// Filtrado de la lista de movimientos: busqueda por texto + recorte por fecha.
//
// Hasta la importacion del historial de Microsoft Money la pantalla tenia un
// punado de movimientos y dibujarlos todos era razonable. Con 478 -y creciendo
// cada ano que se importe- la lista se volvio impracticable: habia que barrerla
// con el dedo para encontrar algo, y no habia forma de acotar el periodo.
//
// La logica vive separada del DOM para poder testearla sin navegador. Las
// fechas se comparan como texto 'YYYY-MM-DD', que es como las guarda Postgres
// y como las devuelve la API: comparar strings en ese formato da el mismo
// orden que comparar fechas, y evita la unica trampa real de este archivo, que
// es `new Date('2026-08-02')` interpretando en UTC y corriendo un dia para
// atras en Argentina.

const RANGOS = ['30d', 'mes', '3m', 'ano', 'todo', 'entre'];

const filtroActual = {
    texto: '',
    rango: '30d',   // lo que Julio eligio ver al entrar
    desde: '',
    hasta: ''
};

function aTexto(fecha) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Devuelve los limites del rango elegido como strings 'YYYY-MM-DD'.
// `hoy` se puede inyectar para poder testear sin depender del dia real.
function limitesDelRango(filtro, hoy = new Date()) {
    if (filtro.rango === 'todo') return { desde: '', hasta: '' };

    if (filtro.rango === 'entre') {
        // Si escribio las fechas al reves, se dan vuelta en vez de no mostrar
        // nada: es un error de tipeo, no una consulta vacia.
        const a = filtro.desde;
        const b = filtro.hasta;
        if (a && b && a > b) return { desde: b, hasta: a };
        return { desde: a || '', hasta: b || '' };
    }

    const hasta = aTexto(hoy);

    if (filtro.rango === 'mes') {
        return { desde: aTexto(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta };
    }
    if (filtro.rango === 'ano') {
        return { desde: aTexto(new Date(hoy.getFullYear(), 0, 1)), hasta };
    }
    if (filtro.rango === '3m') {
        return { desde: aTexto(new Date(hoy.getFullYear(), hoy.getMonth() - 3, hoy.getDate())), hasta };
    }
    // 30d: ventana movil, incluye hoy, por eso son 29 dias para atras.
    const desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 29);
    return { desde: aTexto(desde), hasta };
}

// Se normaliza para que "psicologa" encuentre "Psicóloga" y "cafe" encuentre
// "Café": nadie escribe los acentos en un buscador.
function normalizar(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        // ̀-ͯ son las tildes y dieresis que NFD deja sueltas.
        .replace(/[̀-ͯ]/g, '');
}

function coincideTexto(transaccion, busqueda) {
    if (!busqueda) return true;
    // Se busca en todo lo que se ve en la tarjeta, no solo en el nombre:
    // "nafta" tiene que encontrar los movimientos de la subcategoria.
    const donde = normalizar([
        transaccion.name,
        transaccion.category,
        transaccion.subcategory
    ].filter(Boolean).join(' '));

    // Varias palabras = todas tienen que estar, en cualquier orden.
    return normalizar(busqueda).split(/\s+/).filter(Boolean)
        .every(palabra => donde.includes(palabra));
}

function aplicarFiltros(transacciones, filtro, categoria = 'all', hoy = new Date()) {
    const { desde, hasta } = limitesDelRango(filtro, hoy);

    return (transacciones || []).filter(t => {
        if (categoria !== 'all' && t.category !== categoria) return false;
        if (desde && t.date < desde) return false;
        if (hasta && t.date > hasta) return false;
        return coincideTexto(t, filtro.texto);
    });
}

// Texto del encabezado: "47 movimientos · 11/07 al 10/08".
function describirRango(filtro, hoy = new Date()) {
    if (filtro.rango === 'todo') return 'Todo el historial';

    const { desde, hasta } = limitesDelRango(filtro, hoy);
    if (!desde && !hasta) return 'Todo el historial';

    const corto = f => f ? f.slice(8, 10) + '/' + f.slice(5, 7) + '/' + f.slice(2, 4) : '';
    if (desde && hasta) return `${corto(desde)} al ${corto(hasta)}`;
    if (desde) return `desde el ${corto(desde)}`;
    return `hasta el ${corto(hasta)}`;
}

if (typeof window !== 'undefined') {
    window.transactionFilters = {
        estado: filtroActual,
        RANGOS,
        limitesDelRango,
        aplicarFiltros,
        describirRango,
        coincideTexto
    };
}

if (typeof module !== 'undefined') {
    module.exports = { RANGOS, limitesDelRango, aplicarFiltros, describirRango, coincideTexto, normalizar };
}
