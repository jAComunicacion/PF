function showScreen(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Show selected screen
    const targetScreen = document.getElementById(`${screenName}-screen`);
    if (targetScreen) targetScreen.classList.add('active');

    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`.nav-btn[data-screen="${screenName}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    window.currentScreen = screenName;

    // Update content based on screen
    if (screenName === 'dashboard') {
        updateDashboard();
    } else if (screenName === 'transactions') {
        renderTransactions();
    } else if (screenName === 'charts') {
        renderChart();
    }
}

window.showScreen = showScreen;
