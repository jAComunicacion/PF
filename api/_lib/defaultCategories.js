// Categorias por defecto de Personal Count.
//
// Vivian en assets/js/data/seedCategories.js, del lado del cliente, cuando cada
// dispositivo sembraba su propio IndexedDB. Ahora la siembra ocurre una sola vez
// contra Postgres, asi que la lista se mudo al servidor: es el unico lugar donde
// tiene sentido que exista una "lista oficial".
//
// La lista original era generica e inventada. Esta sale de los 3.500 movimientos
// que Julio venia cargando en Microsoft Money desde 2021: se conservo lo que uso
// 4 o mas veces durante 2026 y se pliego el resto a su categoria padre. El
// negocio textil (Clientas, Proveedores, Tejedoras, Packaging, COTERIE) quedo
// afuera por decision suya: esta app es para el estudio y la casa.
//
// Cuatro cosas se reordenaron a proposito respecto de Money:
//   1. Los articulos de limpieza estaban dentro de "Groceries", que era comida.
//      Pasaron a Casa.
//   2. El auto estaba partido en tres (nafta, taller, patentes). Es un solo gasto.
//   3. "Bills" mezclaba luz y gas con AFIP. Consumo e impuestos se miran distinto.
//   4. La jubilacion figuraba como si fuera un cliente del estudio. Es un ingreso
//      propio y ahora tiene su categoria.
//
// El script scripts/qif-a-sql.js traduce el historial de Money a estos nombres.
// Si se toca un nombre de aca, hay que tocarlo alla tambien.

const DEFAULT_CATEGORIES = {
    expense: [
        { name: 'Alimentación', subs: ['Supermercado', 'Verduras', 'Carnes', 'Fiambres', 'Panadería'] },
        { name: 'Salidas', subs: ['Restaurante', 'Helado', 'Entretenimiento'] },
        { name: 'Auto', subs: ['Nafta 2008', 'Nafta 307', 'Taller'] },
        { name: 'Casa', subs: ['Julia', 'Instalaciones', 'Obra fondo', 'Limpieza'] },
        { name: 'Salud', subs: ['Farmacia', 'Psicóloga', 'Dentista', 'Consultas'] },
        { name: 'Gastos personales', subs: ['Isa', 'Ale', 'Isabela'] },
        { name: 'Servicios', subs: ['Gas', 'Electricidad', 'Celular'] },
        { name: 'Tarjeta de crédito', subs: ['VISA', 'Mercado Libre'] },
        { name: 'Impuestos', subs: ['AFIP'] },
        { name: 'Préstamo', subs: [] },
        { name: 'Educación', subs: [] },
        { name: 'Ropa', subs: [] },
        { name: 'Mascotas', subs: [] },
        { name: 'Varios', subs: [] }
    ],
    income: [
        { name: 'Estudio', subs: ['Miriam Schild', 'Karina Petelin', 'Ruta J', 'PECARI', 'Danza Flex'] },
        { name: 'Jubilación', subs: [] },
        { name: 'Otros ingresos', subs: [] }
    ]
};

module.exports = { DEFAULT_CATEGORIES };
