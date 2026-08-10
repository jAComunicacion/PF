/* assets/js/setup/loginPage.js
   Lógica de la pantalla de ingreso. */

(function () {
    'use strict';

    const iso = document.getElementById('iso');
    const form = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('submit-btn');
    const msg = document.getElementById('login-msg');

    // El middleware nos manda acá con ?next=/loQueQueria. Sólo se aceptan
    // rutas internas: un "next" con host propio sería un redirect abierto,
    // munición para phishing con nuestro dominio de por medio.
    function safeNext() {
        const raw = new URLSearchParams(window.location.search).get('next');
        if (!raw) return '/';
        if (!raw.startsWith('/') || raw.startsWith('//')) return '/';
        return raw;
    }

    function setBusy(busy) {
        if (iso) iso.classList.toggle('is-busy', busy);
        if (submitBtn) {
            submitBtn.disabled = busy;
            submitBtn.textContent = busy ? 'Verificando' : 'Entrar';
        }
    }

    function say(text) {
        if (msg) msg.textContent = text || '';
    }

    // Si ya hay sesión válida, no tiene sentido pedir la contraseña de nuevo.
    async function redirectIfAlreadyIn() {
        try {
            const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
            if (!res.ok) return;
            const data = await res.json();
            if (data && data.authenticated) window.location.replace(safeNext());
        } catch {
            // Sin red se muestra el formulario igual: no es un error que
            // valga la pena contarle a nadie.
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (submitBtn && submitBtn.disabled) return;

        const password = passwordInput ? passwordInput.value : '';
        if (!password) {
            say('Escribí la contraseña.');
            return;
        }

        setBusy(true);
        say('');

        let res;
        try {
            res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ password })
            });
        } catch {
            setBusy(false);
            say('No se pudo contactar al servidor. Revisá la conexión.');
            return;
        }

        if (res.ok) {
            // No se apaga el bucle: la animación sigue hasta que el navegador
            // cambia de página, así el salto no se siente como un tirón.
            window.location.replace(safeNext());
            return;
        }

        setBusy(false);

        if (res.status === 401) {
            say('Contraseña incorrecta.');
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
            }
            return;
        }

        if (res.status === 500) {
            say('El servidor no tiene configurada la contraseña de acceso (APP_PASSWORD / SESSION_SECRET en Vercel).');
            return;
        }

        say('No se pudo iniciar sesión. Probá de nuevo en un momento.');
    }

    if (form) form.addEventListener('submit', handleSubmit);
    redirectIfAlreadyIn();
})();
