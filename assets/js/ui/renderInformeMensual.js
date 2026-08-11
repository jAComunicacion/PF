// Dibuja el informe mensual: la matriz de meses x categorias.
//
// Se arma como <table> de verdad y no con divs: es una tabla de datos, los
// lectores de pantalla la anuncian como tal, y el encabezado pegajoso y la
// primera columna fija salen con CSS sin trabajo extra.

function celdaMonto(valor) {
    const td = document.createElement('td');
    // Una celda vacia y una en cero dicen cosas distintas: el hueco es lo que
    // muestra que un cliente dejo de facturar. No se rellena con $0,00.
    if (valor === undefined) {
        td.className = 'informe-vacia';
        td.textContent = '';
        return td;
    }
    td.textContent = formatCurrency(valor);
    if (valor < 0) td.classList.add('is-negativo');
    return td;
}

function filaDe(clase, etiqueta, porMes, meses) {
    const tr = document.createElement('tr');
    tr.className = clase;

    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = etiqueta;
    tr.appendChild(th);

    meses.forEach((mes) => tr.appendChild(celdaMonto(porMes[mes])));
    return tr;
}

function renderInformeMensual() {
    const contenedor = document.getElementById('informe-tabla');
    const vacio = document.getElementById('informe-vacio');
    if (!contenedor || !window.informeMensual) return;

    const meses = Number(window.informeMeses || 3);
    const informe = window.informeMensual.calcularInformeMensual(
        window.transactions || [],
        { meses }
    );

    const hayDatos = informe.secciones.some((s) => s.grupos.length > 0);
    if (vacio) vacio.hidden = hayDatos;
    contenedor.innerHTML = '';
    if (!hayDatos) return;

    const tabla = document.createElement('table');
    tabla.className = 'informe-mensual';

    const thead = document.createElement('thead');
    const filaCabecera = document.createElement('tr');
    const esquina = document.createElement('th');
    esquina.scope = 'col';
    esquina.textContent = 'Concepto';
    filaCabecera.appendChild(esquina);

    informe.etiquetas.forEach((etiqueta) => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = etiqueta;
        filaCabecera.appendChild(th);
    });

    thead.appendChild(filaCabecera);
    tabla.appendChild(thead);

    informe.secciones.forEach((seccion) => {
        if (seccion.grupos.length === 0) return;

        const tbody = document.createElement('tbody');
        tbody.className = `informe-seccion is-${seccion.tipo}`;

        const encabezado = document.createElement('tr');
        encabezado.className = 'informe-titulo-seccion';
        const th = document.createElement('th');
        th.scope = 'colgroup';
        th.colSpan = informe.meses.length + 1;
        th.textContent = seccion.titulo;
        encabezado.appendChild(th);
        tbody.appendChild(encabezado);

        seccion.grupos.forEach((grupo) => {
            tbody.appendChild(filaDe('informe-categoria', grupo.categoria, {}, informe.meses));
            grupo.filas.forEach((fila) => {
                tbody.appendChild(filaDe('informe-sub', fila.nombre, fila.porMes, informe.meses));
            });
            tbody.appendChild(
                filaDe('informe-subtotal', `Total ${grupo.categoria}`, grupo.totalPorMes, informe.meses)
            );
        });

        tbody.appendChild(
            filaDe('informe-total', `Total ${seccion.titulo}`, seccion.totalPorMes, informe.meses)
        );

        tabla.appendChild(tbody);
    });

    // Balance al pie: es la respuesta a "como vengo", que es la pregunta por la
    // que se abre la app.
    const pie = document.createElement('tfoot');
    pie.appendChild(
        filaDe('informe-balance', 'Balance', window.informeMensual.balancePorMes(informe), informe.meses)
    );
    tabla.appendChild(pie);

    contenedor.appendChild(tabla);
}

function cambiarRangoInforme(meses) {
    window.informeMeses = Number(meses) || 3;
    renderInformeMensual();
}

window.renderInformeMensual = renderInformeMensual;
window.cambiarRangoInforme = cambiarRangoInforme;
