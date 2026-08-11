function renderSugerenciaPresupuesto() {
    const caja = document.getElementById('budget-suggestion');
    const form = document.getElementById('metas-form');
    if (!caja || !form || !window.gastosFijos) return;

    const resultado = window.gastosFijos.calcularGastosFijos(window.transactions || []);

    // Sin historia suficiente no se inventa un numero: queda el campo manual
    // de siempre, que es lo que habia antes de esta pantalla.
    if (resultado.sugerido === null) {
        caja.hidden = true;
        form.hidden = false;
        return;
    }

    document.getElementById('suggestion-amount').textContent = formatCurrency(resultado.sugerido);
    document.getElementById('suggestion-detail').textContent =
        window.gastosFijos.describirSugerencia(resultado);

    // El desglose es lo que hace que el numero sea aceptable: sin ver de donde
    // sale, un presupuesto sugerido es tan arbitrario como uno inventado.
    const lista = document.getElementById('suggestion-fixed-list');
    lista.innerHTML = '';
    resultado.fijos.forEach((fijo) => {
        const item = document.createElement('li');
        item.innerHTML = `<span>${fijo.nombre}</span><span>${formatCurrency(fijo.mediana)}</span>`;
        lista.appendChild(item);
    });

    document.getElementById('suggestion-math').textContent =
        `Fijos ${formatCurrency(resultado.piso)} + margen variable ${formatCurrency(resultado.margen)}`;

    document.getElementById('suggestion-breakdown').hidden = resultado.fijos.length === 0;

    caja.hidden = false;
    // El formulario arranca oculto: se muestra al tocar Editar. Verlo al lado
    // de la sugerencia invita a ignorarla y volver a inventar un numero.
    form.hidden = true;

    const input = document.getElementById('monthly-budget-input');
    if (input) input.value = resultado.sugerido;

    document.getElementById('btn-accept-suggestion').onclick = () => {
        guardarPresupuesto(resultado.sugerido);
    };

    document.getElementById('btn-edit-suggestion').onclick = () => {
        caja.hidden = true;
        form.hidden = false;
        if (input) input.focus();
    };
}

function openMetasModal() {
    const modal = document.getElementById('metas-modal');
    if (!modal) return;

    const currentBudget = window.monthlyBudget || 0;
    const input = document.getElementById('monthly-budget-input');
    if (input) input.value = currentBudget;

    const form = document.getElementById('metas-form');
    const caja = document.getElementById('budget-suggestion');

    // Si ya hay un presupuesto guardado no se vuelve a sugerir: la sugerencia
    // resuelve el arranque en frio, no es algo que haya que revisar cada vez.
    // Para recalcularlo se borra el valor y se reabre.
    if (currentBudget > 0) {
        if (caja) caja.hidden = true;
        if (form) form.hidden = false;
    } else {
        renderSugerenciaPresupuesto();
    }

    modal.classList.add('active');
}

window.openMetasModal = openMetasModal;
window.renderSugerenciaPresupuesto = renderSugerenciaPresupuesto;
