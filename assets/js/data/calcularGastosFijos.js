// Presupuesto mensual sugerido, sacado del historial en vez de pedirselo al
// usuario.
//
// El campo de Metas pedia inventar un numero y por eso estaba en cero: nadie
// sabe de memoria cuanto gasta por mes. Con cinco anios de movimientos
// cargados, el numero ya esta en los datos.
//
// La idea: separar lo que se paga si o si (alquiler, servicios, cuotas) de lo
// que varia. El piso es la suma de lo fijo; el margen es lo que historicamente
// se gasta ademas. Presupuesto sugerido = piso + margen.

(function (raiz) {
    'use strict';

    const MESES_VENTANA = 6;
    const MIN_MESES_PARA_SER_FIJO = 4;

    function normalizarNombre(texto) {
        // Se reusa la normalizacion del buscador (minusculas, sin acentos).
        // En Node llega por require; en el navegador por window.
        const filtros = (typeof module !== 'undefined' && module.exports)
            ? require('./transactionFilters.js')
            : raiz.transactionFilters;
        return filtros.normalizar(texto);
    }

    // Los `n` meses completos anteriores a `hoy`, como claves 'YYYY-MM'.
    //
    // El mes en curso queda AFUERA a proposito: esta a mitad de camino. Si se
    // incluyera, el presupuesto sugerido bajaria cuanto mas temprano se
    // consultara -el dia 2 mostraria un numero y el dia 28 otro- y un
    // presupuesto que cambia solo no sirve para decidir nada.
    function mesesCompletosPrevios(n, hoy) {
        const meses = [];
        for (let i = n; i >= 1; i--) {
            const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
            meses.push(`${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`);
        }
        return meses;
    }

    // Mediana, no promedio. Un mes con la luz al doble corre el promedio hacia
    // arriba y deja un piso que no se parece a ningun mes real; la mediana lo
    // ignora. Es la diferencia entre un presupuesto usable y uno inflado.
    function mediana(numeros) {
        if (!numeros.length) return 0;
        const ordenados = [...numeros].sort((a, b) => a - b);
        const medio = Math.floor(ordenados.length / 2);
        return ordenados.length % 2 !== 0
            ? ordenados[medio]
            : (ordenados[medio - 1] + ordenados[medio]) / 2;
    }

    // Agrupa los gastos de la ventana por nombre normalizado, y para cada uno
    // arma cuanto se gasto en cada mes.
    function totalesPorNombreYMes(transacciones, meses) {
        const enVentana = new Set(meses);
        const porNombre = new Map();

        (transacciones || []).forEach((t) => {
            if (t.type !== 'expense') return;

            // La fecha se compara como texto: pasarla por new Date la lee como
            // UTC y en Argentina el dia 1 de cada mes cae en el mes anterior.
            const mes = String(t.date || '').slice(0, 7);
            if (!enVentana.has(mes)) return;

            const clave = normalizarNombre(t.name);
            if (!clave) return;

            if (!porNombre.has(clave)) {
                // Se guarda el nombre tal como lo escribio el usuario para
                // poder mostrarlo; la clave normalizada es solo para agrupar.
                porNombre.set(clave, { nombre: String(t.name || '').trim(), porMes: new Map() });
            }

            const registro = porNombre.get(clave);
            const acumulado = registro.porMes.get(mes) || 0;
            registro.porMes.set(mes, acumulado + Number(t.amount || 0));
        });

        return porNombre;
    }

    // Devuelve el detalle completo del calculo, no solo el numero: el modal
    // tiene que poder explicar de donde sale, o el usuario no tiene motivo
    // para aceptarlo.
    function calcularGastosFijos(transacciones, opciones = {}) {
        const hoy = opciones.hoy || new Date();
        const ventana = opciones.meses || MESES_VENTANA;
        const minMeses = opciones.minMeses || MIN_MESES_PARA_SER_FIJO;

        const meses = mesesCompletosPrevios(ventana, hoy);
        const porNombre = totalesPorNombreYMes(transacciones, meses);

        const mesesConDatos = meses.filter((mes) =>
            [...porNombre.values()].some((r) => r.porMes.has(mes))
        );

        if (mesesConDatos.length === 0) {
            return {
                meses, mesesConDatos, fijos: [],
                piso: 0, margen: 0, sugerido: null, sugeridoExacto: 0
            };
        }

        // Si hay menos historia que la ventana pedida, el minimo se ajusta en
        // proporcion. Con 2 meses cargados, exigir 4 apariciones no detectaria
        // nada y la app diria "no encontre gastos fijos", que es falso: lo que
        // falta es historia, no gastos.
        const minAjustado = Math.min(
            minMeses,
            Math.max(2, Math.ceil(mesesConDatos.length * (minMeses / ventana)))
        );

        const fijos = [];
        const clavesFijas = new Set();

        porNombre.forEach((registro, clave) => {
            const apariciones = registro.porMes.size;
            if (apariciones < minAjustado) return;

            // La mediana se saca sobre los meses en los que el gasto APARECE,
            // sin rellenar con ceros los que faltan. Un alquiler que figura 5
            // de 6 meses cuesta lo que cuesta; meterle un 0 por el mes que
            // falta lo abarataria a la mitad.
            clavesFijas.add(clave);
            fijos.push({
                nombre: registro.nombre,
                apariciones,
                mediana: mediana([...registro.porMes.values()])
            });
        });

        fijos.sort((a, b) => b.mediana - a.mediana);
        const piso = fijos.reduce((suma, f) => suma + f.mediana, 0);

        // Margen: lo que se gasta por encima de lo fijo en un mes tipico.
        // Se calcula mes a mes y se toma la mediana, por el mismo motivo que
        // antes: un mes con una compra grande no deberia definir el margen.
        const sobrantesPorMes = mesesConDatos.map((mes) => {
            let total = 0;
            let fijoDelMes = 0;

            porNombre.forEach((registro, clave) => {
                const monto = registro.porMes.get(mes);
                if (monto === undefined) return;
                total += monto;
                if (clavesFijas.has(clave)) fijoDelMes += monto;
            });

            return Math.max(0, total - fijoDelMes);
        });

        const margen = mediana(sobrantesPorMes);
        const sugeridoExacto = piso + margen;

        return {
            meses,
            mesesConDatos,
            fijos,
            piso,
            margen,
            // Se redondea al millar: un presupuesto es una decision, no el
            // resultado de una cuenta. "$1.247.893" se lee como un calculo
            // ajeno; "$1.248.000" se lee como un numero que uno adopta.
            sugerido: Math.round(sugeridoExacto / 1000) * 1000,
            sugeridoExacto
        };
    }

    // Frase para el modal. Sin esto el usuario ve un numero caido del cielo y
    // no tiene forma de saber si confiar.
    function describirSugerencia(resultado) {
        if (!resultado || resultado.sugerido === null) {
            return 'Todavia no hay movimientos suficientes para sugerir un presupuesto.';
        }

        const cantidad = resultado.fijos.length;
        const meses = resultado.mesesConDatos.length;
        const parteFijos = cantidad === 1 ? '1 gasto fijo' : `${cantidad} gastos fijos`;
        const parteMeses = meses === 1 ? '1 mes' : `${meses} meses`;

        if (cantidad === 0) {
            return `Sin gastos fijos detectados en ${parteMeses}. La sugerencia es tu gasto habitual.`;
        }

        return `${parteFijos} detectados sobre ${parteMeses}, mas tu margen variable habitual.`;
    }

    const api = { calcularGastosFijos, describirSugerencia, mediana, mesesCompletosPrevios };

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (raiz) raiz.gastosFijos = api;
})(typeof window !== 'undefined' ? window : null);
