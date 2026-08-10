// Un icono por categoria de la lista oficial (api/_lib/defaultCategories.js).
// Si se agrega una categoria alla y no se le pone icono aca, no se rompe nada:
// cae en el generico. Pero se ve pobre, asi que conviene mantener las dos al dia.
function getCategoryIcon(category) {
    switch (category) {
        // Gastos
        case 'Alimentación': return '<i class="ph ph-shopping-cart"></i>';
        case 'Salidas': return '<i class="ph ph-fork-knife"></i>';
        case 'Auto': return '<i class="ph ph-car"></i>';
        case 'Casa': return '<i class="ph ph-house"></i>';
        case 'Salud': return '<i class="ph ph-first-aid-kit"></i>';
        case 'Gastos personales': return '<i class="ph ph-user"></i>';
        case 'Servicios': return '<i class="ph ph-lightbulb"></i>';
        case 'Tarjeta de crédito': return '<i class="ph ph-credit-card"></i>';
        case 'Impuestos': return '<i class="ph ph-receipt"></i>';
        case 'Préstamo': return '<i class="ph ph-bank"></i>';
        case 'Educación': return '<i class="ph ph-graduation-cap"></i>';
        case 'Ropa': return '<i class="ph ph-t-shirt"></i>';
        case 'Mascotas': return '<i class="ph ph-paw-print"></i>';
        case 'Varios': return '<i class="ph ph-dots-three-circle"></i>';

        // Ingresos
        case 'Estudio': return '<i class="ph ph-briefcase"></i>';
        case 'Jubilación': return '<i class="ph ph-hand-coins"></i>';
        case 'Otros ingresos': return '<i class="ph ph-coins"></i>';

        default: return '<i class="ph ph-circle"></i>';
    }
}

window.getCategoryIcon = getCategoryIcon;
