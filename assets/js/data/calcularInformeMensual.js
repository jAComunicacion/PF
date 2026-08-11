// Informe mensual por categoria: la matriz de meses x categorias.
//
// Replica el reporte "Monthly income and expenses" de Microsoft Money, que es
// la pantalla desde la que Julio saca sus conclusiones. Meses en columnas,
// categoria > subcategoria en filas, subtotal por grupo y total general.
//
// A diferencia del presupuesto sugerido, aca el mes en curso SI entra aunque
// este a mitad de camino: esto es un informe de lo que paso, no un numero
// derivado que tenga que ser estable.

(function (raiz) {
    'use strict';

    // Se escriben a mano en vez de usar toLocaleDateString: el resultado de
    // esa funcion depende de la version de ICU del runtime, y las columnas de
    // una tabla no pueden cambiar de ancho segun el navegador.
    const MESES_CORTOS = [
        'ene', 'feb', 'mar', 'abr', 'may', 'jun',
        'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
    ];

    const SIN_SUBCATEGORIA = 'Sin asignar';

    // Los `n` meses hasta hoy inclusive, como claves 'YYYY-MM'.
    function ultimosMeses(n, hoy) {
        const meses = [];
        for (let i = n - 1; i >= 0; i--) {
            const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
            meses.push(`${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`);
        }
        return meses;
    }

    // "jun" si el informe cae dentro de un mismo anio; "jun 25" si lo cruza.
    // Sin el anio, un informe de 12 meses tendria dos columnas "ago" y no
    // habria forma de saber cual es cual.
    function etiquetarMeses(meses) {
        const anios = new Set(meses.map((m) => m.slice(0, 4)));
        const cruzaAnios = anios.size > 1;

        return meses.map((mes) => {
            const nombre = MESES_CORTOS[Number(mes.slice(5, 7)) - 1];
            return cruzaAnios ? `${nombre} ${mes.slice(2, 4)}` : nombre;
        });
    }

    function sumarEn(mapa, clave, monto) {
        mapa[clave] = (mapa[clave] || 0) + monto;
    }

    function armarSeccion(transacciones, meses, tipo, titulo) {
        const enVentana = new Set(meses);
        const porCategoria = new Map();
        const totalPorMes = {};

        (transacciones || []).forEach((t) => {
            if (t.type !== tipo) return;

            // Comparacion de fechas como texto: 'YYYY-MM-DD' pasado por
            // new Date se lee como UTC y en Argentina el dia 1 de cada mes
            // cae en el mes anterior.
            const mes = String(t.date || '').slice(0, 7);
            if (!enVentana.has(mes)) return;

            const monto = Number(t.amount || 0);
            const categoria = t.category || SIN_SUBCATEGORIA;
            const subcategoria = t.subcategory || SIN_SUBCATEGORIA;

            if (!porCategoria.has(categoria)) {
                porCategoria.set(categoria, { categoria, subs: new Map(), totalPorMes: {} });
            }

            const grupo = porCategoria.get(categoria);
            if (!grupo.subs.has(subcategoria)) {
                grupo.subs.set(subcategoria, { nombre: subcategoria, porMes: {} });
            }

            sumarEn(grupo.subs.get(subcategoria).porMes, mes, monto);
            sumarEn(grupo.totalPorMes, mes, monto);
            sumarEn(totalPorMes, mes, monto);
        });

        // Alfabetico, como Money. Se descarto ordenar por monto: Julio ya sabe
        // leer este informe en ese orden y busca las filas por nombre.
        const comparar = (a, b) => String(a).localeCompare(String(b), 'es');

        const grupos = [...porCategoria.values()]
            .sort((a, b) => comparar(a.categoria, b.categoria))
            .map((grupo) => ({
                categoria: grupo.categoria,
                totalPorMes: grupo.totalPorMes,
                filas: [...grupo.subs.values()].sort((a, b) => comparar(a.nombre, b.nombre))
            }));

        return { tipo, titulo, grupos, totalPorMes };
    }

    // `meses` es la cantidad de columnas: 3 (por defecto), 6 o 12.
    function calcularInformeMensual(transacciones, opciones = {}) {
        const hoy = opciones.hoy || new Date();
        const cantidad = opciones.meses || 3;
        const meses = ultimosMeses(cantidad, hoy);

        return {
            meses,
            etiquetas: etiquetarMeses(meses),
            secciones: [
                armarSeccion(transacciones, meses, 'income', 'Ingresos'),
                armarSeccion(transacciones, meses, 'expense', 'Gastos')
            ]
        };
    }

    // Balance por mes: ingresos menos gastos. Es la ultima fila del informe.
    function balancePorMes(informe) {
        const ingresos = informe.secciones.find((s) => s.tipo === 'income');
        const gastos = informe.secciones.find((s) => s.tipo === 'expense');

        const balance = {};
        informe.meses.forEach((mes) => {
            const entra = (ingresos && ingresos.totalPorMes[mes]) || 0;
            const sale = (gastos && gastos.totalPorMes[mes]) || 0;
            // Solo hay balance si hubo movimiento: un mes sin nada no vale
            // cero, vale vacio, igual que el resto de las celdas.
            if (entra || sale) balance[mes] = entra - sale;
        });

        return balance;
    }

    const api = { calcularInformeMensual, balancePorMes, ultimosMeses, etiquetarMeses, SIN_SUBCATEGORIA };

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (raiz) raiz.informeMensual = api;
})(typeof window !== 'undefined' ? window : null);
