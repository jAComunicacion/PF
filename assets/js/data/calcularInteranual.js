// Comparativa contra el mismo periodo del anio anterior.
//
// El numero que compara es el PORCENTAJE, no los pesos. Entre 2021 y 2026 la
// inflacion argentina hace que "gastaste 90% mas que el ano pasado" sea a la
// vez cierto e inutil: no se sabe si se gasto mas o si todo aumento. En cambio
// "Automovil paso de 11% a 18% de tus gastos" describe un cambio real de
// conducta, y no lo mueve la inflacion.
//
// Los montos se muestran igual, rotulados como lo que son: nominales.

(function (raiz) {
    'use strict';

    function requerirInforme() {
        return (typeof module !== 'undefined' && module.exports)
            ? require('./calcularInformeMensual.js')
            : raiz.informeMensual;
    }

    function sumar(porMes) {
        return Object.values(porMes || {}).reduce((total, valor) => total + valor, 0);
    }

    function porcentaje(parte, total) {
        return total > 0 ? (parte / total) * 100 : 0;
    }

    // Totaliza cada categoria del periodo: {categoria -> monto}.
    function totalesPorCategoria(seccion) {
        const totales = new Map();
        (seccion ? seccion.grupos : []).forEach((grupo) => {
            totales.set(grupo.categoria, sumar(grupo.totalPorMes));
        });
        return totales;
    }

    function compararSeccion(actual, anterior) {
        const deAhora = totalesPorCategoria(actual);
        const deAntes = totalesPorCategoria(anterior);

        const totalActual = sumar(actual ? actual.totalPorMes : {});
        const totalAnterior = sumar(anterior ? anterior.totalPorMes : {});

        // La union de las dos: una categoria que existia el ano pasado y este
        // ano no aparece es justamente lo que interesa ver.
        const categorias = [...new Set([...deAhora.keys(), ...deAntes.keys()])]
            .sort((a, b) => String(a).localeCompare(String(b), 'es'));

        const filas = categorias.map((categoria) => {
            const montoActual = deAhora.get(categoria) || 0;
            const montoAnterior = deAntes.get(categoria) || 0;
            const pctActual = porcentaje(montoActual, totalActual);
            const pctAnterior = porcentaje(montoAnterior, totalAnterior);

            return {
                categoria,
                montoActual,
                montoAnterior,
                porcentajeActual: pctActual,
                porcentajeAnterior: pctAnterior,
                // Diferencia en PUNTOS porcentuales, que es lo comparable.
                // Pasar de 11% a 18% son 7 puntos, no "63% mas".
                puntos: pctActual - pctAnterior
            };
        });

        return {
            tipo: actual ? actual.tipo : 'expense',
            titulo: actual ? actual.titulo : '',
            filas,
            totalActual,
            totalAnterior
        };
    }

    // `meses` es el largo del periodo: los ultimos N meses, contra los mismos
    // N meses de hace un anio.
    function calcularInteranual(transacciones, opciones = {}) {
        const hoy = opciones.hoy || new Date();
        const meses = opciones.meses || 3;
        const informe = requerirInforme();

        const ahora = informe.calcularInformeMensual(transacciones, { hoy, meses });

        // El mismo dia, un anio antes. Se usa el dia 1 para que el 29 de
        // febrero no caiga en marzo del anio no bisiesto.
        const hoyAnioPasado = new Date(hoy.getFullYear() - 1, hoy.getMonth(), 1);
        const antes = informe.calcularInformeMensual(transacciones, { hoy: hoyAnioPasado, meses });

        const seccionesActual = ahora.secciones;
        const seccionesAnterior = antes.secciones;

        return {
            etiquetaActual: `${ahora.etiquetas[0]} a ${ahora.etiquetas[ahora.etiquetas.length - 1]} ${hoy.getFullYear()}`,
            etiquetaAnterior: `${antes.etiquetas[0]} a ${antes.etiquetas[antes.etiquetas.length - 1]} ${hoy.getFullYear() - 1}`,
            mesesActual: ahora.meses,
            mesesAnterior: antes.meses,
            secciones: seccionesActual.map((seccion) =>
                compararSeccion(seccion, seccionesAnterior.find((s) => s.tipo === seccion.tipo))
            )
        };
    }

    // Hay con que comparar solo si el anio pasado tuvo movimientos. Sin esto,
    // el informe muestra una columna entera en cero y parece que se gasto todo
    // de golpe, cuando en realidad no habia datos cargados.
    function hayPeriodoAnterior(comparativa) {
        return comparativa.secciones.some((s) => s.totalAnterior > 0);
    }

    const api = { calcularInteranual, hayPeriodoAnterior };

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (raiz) raiz.interanual = api;
})(typeof window !== 'undefined' ? window : null);
