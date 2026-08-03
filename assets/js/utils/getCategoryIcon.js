function getCategoryIcon(category) {
    switch (category) {
        // Gastos
        case 'Alimentación': return '<i class="ph ph-hamburger"></i>';
        case 'Transporte': return '<i class="ph ph-bus"></i>';
        case 'Entretenimiento': return '<i class="ph ph-popcorn"></i>';
        case 'Servicios': return '<i class="ph ph-lightbulb"></i>';
        case 'Otros': return '<i class="ph ph-dots-three-circle"></i>';

        // Ingresos y Otros
        case 'Ingreso': return '<i class="ph ph-money"></i>';
        case 'Inversión': return '<i class="ph ph-trend-up"></i>';
        case 'Ahorro': return '<i class="ph ph-piggy-bank"></i>';
        case 'Transferencia': return '<i class="ph ph-arrows-left-right"></i>';
        case 'Pago': return '<i class="ph ph-credit-card"></i>';
        case 'Clientes': return '<i class="ph ph-users"></i>';
        case 'Aportes': return '<i class="ph ph-hand-coins"></i>';
        case 'Otros ingresos': return '<i class="ph ph-coins"></i>';

        default: return '<i class="ph ph-shopping-cart"></i>';
    }
}

window.getCategoryIcon = getCategoryIcon;
