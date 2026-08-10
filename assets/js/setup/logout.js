/* assets/js/setup/logout.js — cierre de sesión */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('logout-btn');
        if (!btn) return;

        btn.addEventListener('click', async () => {
            btn.disabled = true;
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'same-origin'
                });
            } catch {
                // Aunque falle la llamada conviene mandar a la pantalla de
                // ingreso: el middleware va a frenar el paso de todos modos.
            }
            window.location.replace('/login.html');
        });
    });
})();
