// Las dos vistas que se apoyan en el motor del informe mensual:
// la comparativa contra el anio pasado y la estacionalidad.
//
// Viven abajo de la matriz, en la misma solapa "Informes", y no como solapas
// propias: cinco solapas no entran en la fila de un celular.

function porcentajeTexto(valor) {
    return `${valor.toFixed(1).replace('.', ',')}%`;
}

// Los puntos porcentuales son la unidad que compara: pasar de 11% a 18% son
// 7 puntos. Decir "63% mas" seria cierto y confuso.
function puntosTexto(puntos) {
    if (Math.abs(puntos) < 0.05) return '=';
    const signo = puntos > 0 ? '+' : '−';
    return `${signo}${Math.abs(puntos).toFixed(1).replace('.', ',')} pts`;
}

function renderInteranual() {
    const contenedor = document.getElementById('interanual-tabla');
    const aviso = document.getElementById('interanual-vacio');
    if (!contenedor || !window.interanual) return;

    const meses = Number(window.informeMeses || 3);
    const comparativa = window.interanual.calcularInteranual(window.transactions || [], { meses });

    contenedor.innerHTML = '';

    // Sin datos del anio pasado, la tabla mostraria una columna entera en cero
    // y pareceria que el gasto se disparo. Mejor decir que no hay con que
    // comparar.
    if (!window.interanual.hayPeriodoAnterior(comparativa)) {
        if (aviso) {
            aviso.hidden = false;
            aviso.textContent = `No hay movimientos de ${comparativa.etiquetaAnterior} para comparar.`;
        }
        return;
    }
    if (aviso) aviso.hidden = true;

    comparativa.secciones.forEach((seccion) => {
        if (seccion.filas.length === 0) return;

        const tabla = document.createElement('table');
        tabla.className = 'interanual-tabla';

        const caption = document.createElement('caption');
        caption.textContent = seccion.titulo;
        tabla.appendChild(caption);

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th scope="col">Categoría</th>
                <th scope="col">${comparativa.etiquetaActual}</th>
                <th scope="col">${comparativa.etiquetaAnterior}</th>
                <th scope="col">Peso</th>
            </tr>`;
        tabla.appendChild(thead);

        const tbody = document.createElement('tbody');

        // El semaforo solo tiene sentido en los gastos: ahi, ganar peso es
        // empeorar. En los ingresos, que una categoria pese mas no es bueno ni
        // malo -es concentracion- asi que va en tinta neutra. Pintarlo de rojo
        // seria decir algo que no sabemos.
        const conSemaforo = seccion.tipo === 'expense';

        seccion.filas.forEach((f) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <th scope="row">${f.categoria}</th>
                <td>
                    <span class="monto">${formatCurrency(f.montoActual)}</span>
                    <span class="peso">${porcentajeTexto(f.porcentajeActual)}</span>
                </td>
                <td>
                    <span class="monto">${formatCurrency(f.montoAnterior)}</span>
                    <span class="peso">${porcentajeTexto(f.porcentajeAnterior)}</span>
                </td>
                <td class="puntos ${conSemaforo ? (f.puntos > 0 ? 'is-sube' : f.puntos < 0 ? 'is-baja' : '') : ''}">${puntosTexto(f.puntos)}</td>`;
            tbody.appendChild(tr);
        });
        tabla.appendChild(tbody);
        contenedor.appendChild(tabla);
    });
}

function renderEstacionalidad() {
    const contenedor = document.getElementById('estacionalidad-barras');
    const aviso = document.getElementById('estacionalidad-vacio');
    const resumen = document.getElementById('estacionalidad-resumen');
    if (!contenedor || !window.estacionalidad) return;

    const r = window.estacionalidad.calcularEstacionalidad(window.transactions || []);

    contenedor.innerHTML = '';

    if (!r.suficiente) {
        if (aviso) {
            aviso.hidden = false;
            aviso.textContent = 'Hacen falta al menos dos años completos de movimientos para ver el patrón de tus meses.';
        }
        if (resumen) resumen.textContent = '';
        return;
    }
    if (aviso) aviso.hidden = true;

    if (resumen) resumen.textContent = window.estacionalidad.describirProximo(r);

    // La escala se toma del mes mas alto, no del 100%: con valores en torno al
    // 8% todas las barras serian invisibles.
    const maximo = Math.max(...r.meses.map((m) => m.participacion), r.mesParejo);

    r.meses.forEach((m) => {
        const fila = document.createElement('div');
        fila.className = 'estacion-fila';
        if (m.pesado) fila.classList.add('is-pesado');
        if (!m.confiable) fila.classList.add('is-flojo');
        if (m.mes === r.proximo.mes) fila.classList.add('is-proximo');

        const ancho = maximo > 0 ? (m.participacion / maximo) * 100 : 0;

        fila.innerHTML = `
            <span class="estacion-mes">${m.nombre}</span>
            <span class="estacion-barra"><span style="width:${ancho}%"></span></span>
            <span class="estacion-valor">${m.confiable ? porcentajeTexto(m.participacion) : '—'}</span>`;

        contenedor.appendChild(fila);
    });

    const nota = document.createElement('p');
    nota.className = 'estacion-nota';
    nota.textContent = `Sobre ${r.aniosUsados.length} años completos (${r.aniosUsados.join(', ')}). Un mes parejo es 8,3%.`;
    contenedor.appendChild(nota);
}

window.renderInteranual = renderInteranual;
window.renderEstacionalidad = renderEstacionalidad;
