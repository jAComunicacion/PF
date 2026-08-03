function closeMetasModal() {
    const modal = document.getElementById('metas-modal');
    if (!modal) return;

    modal.classList.remove('active');
    document.getElementById('metas-form').reset();
}

window.closeMetasModal = closeMetasModal;
