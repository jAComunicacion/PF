async function backupToJSON() {
    if (!window.db) {
        alert("Base de datos no inicializada.");
        return;
    }

    try {
        const transactions = await window.db.transactions.toArray();
        const settings = await window.db.settings.toArray();

        const backupData = {
            version: 1,
            date: new Date().toISOString(),
            transactions: transactions,
            settings: settings
        };

        const fileName = `personal_count_backup_${new Date().toISOString().split('T')[0]}.json`;

        // Modern File System Access API
        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{
                        description: 'JSON Backup',
                        accept: { 'application/json': ['.json'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(JSON.stringify(backupData, null, 2));
                await writable.close();
                alert("Backup guardado exitosamente.");
                return;
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error saving file:', err);
                } else {
                    return; // User cancelled
                }
            }
        }

        // Fallback for older browsers
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', fileName);
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
    } catch (e) {
        console.error("Backup failed:", e);
        alert("Error generando el backup.");
    }
}

window.backupToJSON = backupToJSON;
