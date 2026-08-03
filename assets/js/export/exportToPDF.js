function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = jsPDF();

    // Título
    doc.setFontSize(20);
    doc.setTextColor(0, 255, 255); // Color cian
    doc.text('Reporte de Finanzas Personales', 20, 20);

    // Saldo
    const balance = calculateBalance();
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Saldo Total: ${formatCurrency(balance)}`, 20, 35);

    // Lista de transacciones
    doc.setFontSize(12);
    let y = 50;
    doc.text('Transacciones:', 20, y);
    y += 10;

    const filteredTransactions = (window.transactions || []).sort((a, b) => new Date(b.date) - new Date(a.date));

    filteredTransactions.forEach(t => {
        if (y > 280) {
            doc.addPage();
            y = 20;
        }
        const text = `${t.date} - ${t.name} (${t.category}): ${formatCurrency(t.amount, t.type)}`;
        doc.text(text, 20, y);
        y += 8;
    });

    doc.save(`reporte_finanzas_${new Date().toISOString().split('T')[0]}.pdf`);
}

window.exportToPDF = exportToPDF;
