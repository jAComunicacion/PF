// assets/js/ui/handleAddCategory.js

async function addNewCategory() {
    const type = document.getElementById('transaction-type').value;
    const parentCategorySelect = document.getElementById('transaction-category');
    const parentCategoryName = parentCategorySelect.value;

    // Ask user what they want to add
    // Simple approach: standard prompt for now, can be upgraded to modal later
    const mode = prompt("Escribe '1' para Nueva Categoría Principal\nEscribe '2' para Subcategoría de " + parentCategoryName);

    if (mode === '1') {
        const name = prompt("Nombre de la nueva Categoría (" + (type === 'income' ? 'Ingreso' : 'Gasto') + "):");
        if (name) {
            await window.categoryService.addCategory(name, type, null);
            showToast(`Categoría "${name}" creada.`, 'success');
            // Refresh modal
            openTransactionModal(type);
        }
    } else if (mode === '2') {
        const parentId = parentCategorySelect.options[parentCategorySelect.selectedIndex].dataset.id;
        if (!parentId) {
            showToast('Selecciona una categoría válida primero.', 'error');
            return;
        }

        const name = prompt("Nombre de la Subcategoría para " + parentCategoryName + ":");
        if (name) {
            // Convert parentId to number (Dexie auto-increment uses numbers)
            await window.categoryService.addCategory(name, type, Number(parentId));
            showToast(`Subcategoría "${name}" creada.`, 'success');
            // Trigger change to reload subs
            handleCategoryChange(parentCategoryName);
        }
    }
}

window.addNewCategory = addNewCategory;
