// Cuántas tarjetas se dibujan de una. Con "Todo" el período tiene cientos de
// movimientos y armar ese DOM entero traba la pantalla en el celular; el resto
// entra por tandas con el botón "Ver más".
const TANDA = 60;
let visibles = TANDA;

// Toda vuelta a filtrar arranca la lista de nuevo: si no, al achicar el
// período quedaría un "ver más" que ya no tiene nada que mostrar.
function resetVisibles() {
    visibles = TANDA;
}

function transaccionesFiltradas() {
    const categoryFilterEl = document.getElementById('category-filter');
    const categoria = categoryFilterEl ? categoryFilterEl.value : 'all';
    const filtros = window.transactionFilters;

    if (!filtros) return (window.transactions || []).slice();
    return filtros.aplicarFiltros(window.transactions, filtros.estado, categoria);
}

function armarTarjeta(transaction) {
    const transactionCard = document.createElement('div');
    transactionCard.classList.add('transaction-card');

    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'transaction-icon';
    iconWrapper.innerHTML = getCategoryIcon(transaction.category);

    const infoWrapper = document.createElement('div');
    infoWrapper.className = 'transaction-info';

    const nameEl = document.createElement('p');
    nameEl.className = 'transaction-name';
    nameEl.textContent = transaction.name;

    const detailsEl = document.createElement('p');
    detailsEl.className = 'transaction-details';
    // La fecha se parte a mano en vez de pasarla por new Date(): el string
    // 'YYYY-MM-DD' se interpreta como UTC y en Argentina se corría un día.
    const [a, m, d] = String(transaction.date).split('-');
    detailsEl.textContent = `${transaction.category}${transaction.subcategory ? ` (${transaction.subcategory})` : ''} - ${d}/${m}/${a}`;

    infoWrapper.appendChild(nameEl);
    infoWrapper.appendChild(detailsEl);

    const amountEl = document.createElement('div');
    amountEl.className = `transaction-amount ${transaction.type}`;
    amountEl.textContent = formatCurrency(transaction.amount, transaction.type);

    const actionsWrapper = document.createElement('div');
    actionsWrapper.className = 'transaction-actions';

    const editButton = document.createElement('button');
    editButton.className = 'edit-btn-inline';
    editButton.type = 'button';
    editButton.textContent = 'Editar';
    editButton.addEventListener('click', () => openTransactionModal(transaction.type, transaction.name, transaction));

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-btn';
    deleteButton.type = 'button';
    deleteButton.textContent = '×';
    deleteButton.addEventListener('click', () => deleteTransaction(transaction.id));

    actionsWrapper.appendChild(editButton);
    actionsWrapper.appendChild(deleteButton);

    transactionCard.appendChild(iconWrapper);
    transactionCard.appendChild(infoWrapper);
    transactionCard.appendChild(amountEl);
    transactionCard.appendChild(actionsWrapper);
    return transactionCard;
}

function renderTransactions() {
    const listEl = document.querySelector('.transactions-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    const filtradas = transaccionesFiltradas();
    filtradas.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    const aDibujar = filtradas.slice(0, visibles);

    // Se arma todo aparte y se inserta de una sola vez: con cientos de
    // movimientos, agregarlos de a uno obliga al navegador a recalcular la
    // pantalla en cada vuelta.
    const fragmento = document.createDocumentFragment();
    aDibujar.forEach(t => fragmento.appendChild(armarTarjeta(t)));
    listEl.appendChild(fragmento);

    renderResumen(filtradas, aDibujar.length, listEl);
    renderVerMas(filtradas.length);
}

function renderResumen(filtradas, dibujadas, listEl) {
    const resumenEl = document.getElementById('list-summary');
    if (!resumenEl) return;

    const filtros = window.transactionFilters;
    const periodo = filtros ? filtros.describirRango(filtros.estado) : '';

    if (filtradas.length === 0) {
        const buscando = filtros && filtros.estado.texto;
        const todoElHistorial = !filtros || filtros.estado.rango === 'todo';

        resumenEl.textContent = buscando
            ? `Sin resultados para "${filtros.estado.texto}" en ${periodo.toLowerCase()}.`
            : `No hay movimientos en ${periodo.toLowerCase()}.`;

        // Un vacío sin explicación se lee como "se rompió". Se ofrece la salida
        // que corresponda: sugerir "ampliar el período" cuando el período ya es
        // todo el historial no ayuda a nadie.
        const salida = document.createElement('p');
        salida.className = 'empty-hint';
        if (!todoElHistorial) {
            salida.textContent = 'Probá ampliar el período o tocar "Todo".';
        } else if (buscando) {
            salida.textContent = 'No hay ningún movimiento con ese texto. Probá con menos palabras.';
        } else {
            salida.textContent = 'Todavía no hay movimientos cargados.';
        }
        listEl.appendChild(salida);
        return;
    }

    const saldo = filtradas.reduce(
        (s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);

    const cuantos = filtradas.length === 1
        ? '1 movimiento'
        : `${filtradas.length} movimientos`;
    const mostrando = dibujadas < filtradas.length ? ` · mostrando ${dibujadas}` : '';

    resumenEl.textContent = `${cuantos}${mostrando} · ${periodo} · saldo ${formatCurrency(saldo)}`;
}

function renderVerMas(total) {
    const btn = document.getElementById('show-more-btn');
    if (!btn) return;

    const faltan = total - visibles;
    btn.hidden = faltan <= 0;
    if (faltan > 0) {
        btn.textContent = `Ver ${Math.min(faltan, TANDA)} más (quedan ${faltan})`;
    }
}

function verMasTransacciones() {
    visibles += TANDA;
    renderTransactions();
}

window.renderTransactions = renderTransactions;
window.resetVisibles = resetVisibles;
window.verMasTransacciones = verMasTransacciones;
