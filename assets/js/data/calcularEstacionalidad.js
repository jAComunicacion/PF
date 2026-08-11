// Estacionalidad: que meses del anio pegan fuerte.
//
// No se mide en pesos sino en QUE PORCENTAJE DEL ANIO cae en cada mes. Con la
// inflacion argentina, "en marzo gastas $800.000" no dice nada -depende del
// anio- pero "marzo se lleva el 12% de tu anio, contra un 8,3% de mes promedio"
// vale igual en 2021 que en 2026.
//
// Un anio parejo reparte 100/12 = 8,33% por mes. Los meses por encima de eso
// son los que hay que anticipar.

(function (raiz) {
    'use strict';

    const MESES_LARGOS = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const MES_PAREJO = 100 / 12;

    // Un anio cuenta solo si tiene movimientos en al menos 10 meses distintos.
    //
    // Sin este filtro, el anio en curso arruina el calculo: en agosto, 2026
    // tiene 8 meses cargados, asi que cada uno se lleva ~12,5% de "su anio" y
    // todos parecen meses pesados. Lo mismo con el primer anio importado, que
    // suele arrancar por la mitad.
    const MESES_MINIMOS_POR_ANIO = 10;

    function mediana(numeros) {
        if (!numeros.length) return 0;
        const ordenados = [...numeros].sort((a, b) => a - b);
        const medio = Math.floor(ordenados.length / 2);
        return ordenados.length % 2 !== 0
            ? ordenados[medio]
            : (ordenados[medio - 1] + ordenados[medio]) / 2;
    }

    function gastoPorAnioYMes(transacciones) {
        const porAnio = new Map();

        (transacciones || []).forEach((t) => {
            if (t.type !== 'expense') return;

            // Fecha como texto: 'YYYY-MM-DD' pasado por new Date se lee como
            // UTC y en Argentina el dia 1 cae en el mes anterior.
            const fecha = String(t.date || '');
            const anio = fecha.slice(0, 4);
            const mes = Number(fecha.slice(5, 7));
            if (!anio || !mes) return;

            if (!porAnio.has(anio)) porAnio.set(anio, new Map());
            const meses = porAnio.get(anio);
            meses.set(mes, (meses.get(mes) || 0) + Number(t.amount || 0));
        });

        return porAnio;
    }

    function calcularEstacionalidad(transacciones, opciones = {}) {
        const hoy = opciones.hoy || new Date();
        const minimoMeses = opciones.minimoMeses || MESES_MINIMOS_POR_ANIO;

        const porAnio = gastoPorAnioYMes(transacciones);

        // Solo anios completos, y solo con gasto mayor a cero (dividir por el
        // total de un anio vacio daria infinito).
        const aniosUsados = [...porAnio.entries()]
            .filter(([, meses]) => meses.size >= minimoMeses)
            .filter(([, meses]) => [...meses.values()].reduce((a, b) => a + b, 0) > 0)
            .map(([anio]) => anio)
            .sort();

        // Para cada mes del anio, su participacion en cada anio disponible.
        const participaciones = new Map();
        aniosUsados.forEach((anio) => {
            const meses = porAnio.get(anio);
            const totalAnual = [...meses.values()].reduce((a, b) => a + b, 0);

            meses.forEach((monto, mes) => {
                if (!participaciones.has(mes)) participaciones.set(mes, []);
                participaciones.get(mes).push((monto / totalAnual) * 100);
            });
        });

        const meses = MESES_LARGOS.map((nombre, indice) => {
            const mes = indice + 1;
            const muestras = participaciones.get(mes) || [];
            const participacion = mediana(muestras);

            return {
                mes,
                nombre,
                participacion,
                muestras: muestras.length,
                // Con una sola muestra no hay patron, hay una anecdota. Se
                // muestra atenuado y sin conclusion.
                confiable: muestras.length >= 2,
                pesado: muestras.length >= 2 && participacion > MES_PAREJO
            };
        });

        // El mes que viene: el aviso util es el anticipado, no el que llega
        // cuando ya estas adentro.
        const indiceProximo = (hoy.getMonth() + 1) % 12;

        return {
            aniosUsados,
            meses,
            mesParejo: MES_PAREJO,
            proximo: meses[indiceProximo],
            // Sin al menos dos anios completos no hay estacionalidad que medir,
            // solo el dibujo de un anio suelto.
            suficiente: aniosUsados.length >= 2
        };
    }

    function describirProximo(resultado) {
        const proximo = resultado.proximo;
        if (!resultado.suficiente || !proximo || !proximo.confiable) return '';

        const nombre = proximo.nombre.charAt(0).toUpperCase() + proximo.nombre.slice(1);
        const pct = proximo.participacion.toFixed(1).replace('.', ',');

        if (proximo.pesado) {
            return `${nombre} suele ser un mes pesado: se lleva el ${pct}% de tu año, contra el 8,3% de un mes parejo.`;
        }
        return `${nombre} suele ser un mes tranquilo: se lleva el ${pct}% de tu año.`;
    }

    const api = { calcularEstacionalidad, describirProximo, mediana, MES_PAREJO };

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (raiz) raiz.estacionalidad = api;
})(typeof window !== 'undefined' ? window : null);
