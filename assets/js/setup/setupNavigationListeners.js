function setupNavigationListeners() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const screen = this.dataset.screen;
            showScreen(screen);
        });
    });
}

window.setupNavigationListeners = setupNavigationListeners;
