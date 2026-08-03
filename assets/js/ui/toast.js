function showToast(message, type = 'success') {
    const safeType = ['success', 'error', 'info'].includes(type) ? type : 'success';

    // Create container if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${safeType}`;

    const iconWrapper = document.createElement('span');
    iconWrapper.className = 'toast-icon';

    const iconEl = document.createElement('i');
    if (safeType === 'error') {
        iconEl.className = 'ph ph-warning-circle';
    } else if (safeType === 'info') {
        iconEl.className = 'ph ph-info';
    } else {
        iconEl.className = 'ph ph-check-circle';
    }
    iconWrapper.appendChild(iconEl);

    const messageEl = document.createElement('span');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;

    toast.appendChild(iconWrapper);
    toast.appendChild(messageEl);

    // Add to container
    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            container.removeChild(toast);
        }, 300); // Wait for fade out animation
    }, 3000);
}

// Global exposure
window.showToast = showToast;
