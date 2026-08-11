// Convierte un instante a la fecha calendario argentina, como 'YYYY-MM-DD'.
//
// Las notificaciones traen la cabecera Date: en UTC. Un movimiento hecho el
// 30/06 a las 23:14 hora argentina viaja como "1 Jul 2026 02:14:54 +0000":
// tomar los primeros 10 caracteres, o usar getUTCFullYear(), lo manda al mes
// siguiente. Con 3 horas de diferencia esto pasa todas las noches.
//
// Ojo: aca `new Date()` SI corresponde, a diferencia del resto del proyecto.
// El problema conocido es con los strings 'YYYY-MM-DD' de la API, que no
// traen zona y se leen como UTC. Estas cabeceras traen el offset explicito,
// asi que el instante que representan no es ambiguo.
const ZONA = 'America/Argentina/Buenos_Aires';

const formateador = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

function aFechaArgentina(valor) {
    const instante = valor instanceof Date ? valor : new Date(valor);
    if (Number.isNaN(instante.getTime())) return null;

    // Se arma a mano desde las partes en vez de confiar en el formato de
    // 'en-CA': el separador y el orden dependen de la version de ICU que
    // traiga el runtime, y Vercel no necesariamente usa la misma que local.
    const partes = {};
    for (const { type, value } of formateador.formatToParts(instante)) {
        partes[type] = value;
    }

    return `${partes.year}-${partes.month}-${partes.day}`;
}

module.exports = { aFechaArgentina, ZONA };
