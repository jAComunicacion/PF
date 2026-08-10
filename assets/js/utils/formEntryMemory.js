// "Memoria" del formulario de transacción: recordar la última fecha usada y
// autocompletar por nombre repetido, tal como lo hacía Microsoft Money.
//
// La fecha se guarda en localStorage porque es preferencia del dispositivo,
// no un dato de la cuenta. El autocompletado por nombre, en cambio, no
// necesita guardar nada: los movimientos ya están en window.transactions
// (ordenados del más nuevo al más viejo), así que alcanza con buscar ahí.

const LAST_DATE_KEY = 'pc_last_date';

function lastUsedDate() {
    try {
        return localStorage.getItem(LAST_DATE_KEY) || '';
    } catch (e) {
        return '';
    }
}

function rememberDate(dateStr) {
    if (!dateStr) return;
    try {
        localStorage.setItem(LAST_DATE_KEY, dateStr);
    } catch (e) {
        // Modo privado o storage lleno: no es crítico, simplemente no recuerda.
    }
}

// Mismo criterio de "coincide" que el buscador de la lista de movimientos:
// sin tildes y sin mayúsculas, para que "cafe" encuentre "Café".
function normalizar(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim();
}

// Busca, entre los movimientos ya cargados, el más reciente con el mismo
// nombre y tipo (gasto/ingreso). window.transactions viene ordenado del más
// nuevo al más viejo, así que el primer match ya es el último uso.
function findLastTransactionByName(name, type) {
    const objetivo = normalizar(name);
    if (!objetivo) return null;

    return (window.transactions || []).find(t =>
        t.type === type && normalizar(t.name) === objetivo
    ) || null;
}

window.lastUsedDate = lastUsedDate;
window.rememberDate = rememberDate;
window.findLastTransactionByName = findLastTransactionByName;
