// Conecta el buscador y los botones de período con el estado de los filtros.
// Toda la lógica de qué entra y qué no vive en data/transactionFilters.js;
// acá sólo se escuchan los controles y se vuelve a dibujar.

function setupListFilters() {
    const filtros = window.transactionFilters;
    if (!filtros) return;

    const buscador = document.getElementById('transaction-search');
    const borrar = document.getElementById('search-clear');
    const tabs = document.getElementById('range-tabs');
    const custom = document.getElementById('range-custom');
    const desde = document.getElementById('range-from');
    const hasta = document.getElementById('range-to');
    const verMas = document.getElementById('show-more-btn');

    // Cualquier cambio de filtro devuelve la lista al principio.
    function redibujar() {
        if (window.resetVisibles) window.resetVisibles();
        renderTransactions();
    }

    if (buscador) {
        // Se espera a que deje de escribir: filtrar en cada tecla sobre cientos
        // de movimientos hace saltar el teclado del celular.
        let esperando;
        buscador.addEventListener('input', () => {
            if (borrar) borrar.hidden = buscador.value.length === 0;
            clearTimeout(esperando);
            esperando = setTimeout(() => {
                filtros.estado.texto = buscador.value.trim();
                redibujar();
            }, 180);
        });

        // Enter no debe recargar nada, sólo aplicar ya.
        buscador.addEventListener('keydown', e => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            clearTimeout(esperando);
            filtros.estado.texto = buscador.value.trim();
            redibujar();
        });
    }

    if (borrar && buscador) {
        borrar.addEventListener('click', () => {
            buscador.value = '';
            borrar.hidden = true;
            filtros.estado.texto = '';
            redibujar();
            buscador.focus();
        });
    }

    if (tabs) {
        tabs.addEventListener('click', e => {
            const boton = e.target.closest('.range-tab');
            if (!boton) return;

            const rango = boton.dataset.range;
            filtros.estado.rango = rango;

            tabs.querySelectorAll('.range-tab').forEach(b => {
                b.classList.toggle('is-active', b === boton);
            });

            if (custom) custom.hidden = rango !== 'entre';

            // "Entre fechas" sin fechas cargadas mostraría todo el historial de
            // golpe. Se arranca con el mes en curso como punto de partida.
            if (rango === 'entre' && desde && hasta && !desde.value && !hasta.value) {
                const hoy = new Date();
                const dosDigitos = n => String(n).padStart(2, '0');
                const texto = f => `${f.getFullYear()}-${dosDigitos(f.getMonth() + 1)}-${dosDigitos(f.getDate())}`;
                desde.value = texto(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
                hasta.value = texto(hoy);
                filtros.estado.desde = desde.value;
                filtros.estado.hasta = hasta.value;
            }

            redibujar();
        });
    }

    [desde, hasta].forEach(campo => {
        if (!campo) return;
        campo.addEventListener('change', () => {
            filtros.estado.desde = desde ? desde.value : '';
            filtros.estado.hasta = hasta ? hasta.value : '';
            filtros.estado.rango = 'entre';
            redibujar();
        });
    });

    if (verMas) {
        verMas.addEventListener('click', () => window.verMasTransacciones());
    }
}

window.setupListFilters = setupListFilters;
