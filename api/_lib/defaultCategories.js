// Categorias por defecto de Personal Count.
//
// Vivian en assets/js/data/seedCategories.js, del lado del cliente, cuando cada
// dispositivo sembraba su propio IndexedDB. Ahora la siembra ocurre una sola vez
// contra Postgres, asi que la lista se mudo al servidor: es el unico lugar donde
// tiene sentido que exista una "lista oficial".

const DEFAULT_CATEGORIES = {
    expense: [
        { name: 'Alimentación', subs: ['Supermercado', 'Restaurante', 'Delivery'] },
        { name: 'Transporte', subs: ['Taxi/Uber', 'Transporte Público', 'Combustible', 'Mantenimiento'] },
        { name: 'Entretenimiento', subs: ['Cine', 'Juegos', 'Salidas'] },
        { name: 'Servicios', subs: ['Luz', 'Agua', 'Internet', 'Celular'] },
        { name: 'Salud', subs: ['Farmacia', 'Consulta Médica'] },
        { name: 'Educación', subs: ['Cursos', 'Libros', 'Universidad'] },
        { name: 'Otros', subs: [] }
    ],
    income: [
        { name: 'Ingreso', subs: ['Sueldo', 'Freelance'] },
        { name: 'Clientes', subs: ['Venta Directa', 'Servicios', 'Abono Mensual'] },
        { name: 'Aportes', subs: ['Socio A', 'Socio B', 'Inversión Propia'] },
        { name: 'Otros ingresos', subs: ['Intereses', 'Venta de Activos', 'Reembolsos'] }
    ]
};

module.exports = { DEFAULT_CATEGORIES };
