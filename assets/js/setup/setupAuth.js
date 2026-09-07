// Local Auth & Profile Management
// Handles user identity (mock) and persistent profile settings (Name/Photo)

// Sin nombre por defecto a propósito: esto es un solo código para todas
// las instancias (la de Julio y la de cada cliente), así que un nombre
// hardcodeado ("Julio") saludaría mal a cualquier otro cliente en el
// instante entre el primer pintado y que /api/settings responda. El
// nombre real llega de `userName` (ajuste propio, se edita tocando el
// saludo) o de `clientName` (branding de la instancia, ver README) — hasta
// que uno de los dos llega, el saludo queda sin nombre ("¡Hola!").
const defaultUser = {
    uid: "local-user-v1",
    displayName: "",
    photoURL: "assets/logos/jacomunicacion.jpg",
    email: "local@app.com"
};

// Oscurece un hex multiplicando cada canal — misma relación que ya existe
// entre --petrol/--petrol-deep/--petrol-ink en estilos.css (~63% y ~43%
// del valor original), para que el acento de marca del cliente cascadee
// también a la tarjeta de saldo y no se quede solo en botones.
function darkenHex(hex, factor) {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.round(((n >> 16) & 255) * factor);
    const g = Math.round(((n >> 8) & 255) * factor);
    const b = Math.round((n & 255) * factor);
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

// Aclara un hex mezclándolo con blanco — el "celeste" del porcentaje de
// Estado de Finanzas y de la navegación inferior sale del mismo acento,
// no de un color inventado aparte.
function lightenHex(hex, factor) {
    const n = parseInt(hex.replace('#', ''), 16);
    const mix = c => Math.round(c * factor + 255 * (1 - factor));
    const r = mix((n >> 16) & 255);
    const g = mix((n >> 8) & 255);
    const b = mix(n & 255);
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

window.auth = {
    currentUser: defaultUser,
    onAuthStateChanged: async (callback) => {
        callback(defaultUser);
        return () => { };
    },
    signOut: () => window.location.replace('/login.html')
};

function setupAuth() {
    const userNameEl = document.querySelector('.greeting'); // The entire h1
    const nameSpan = document.getElementById('user-name');
    const profileImgEl = document.getElementById('profile-img');

    // La coma vive acá, no en el HTML: así "¡Hola!" (sin nombre todavía)
    // no le queda una coma colgando.
    function paintName(name) {
        if (nameSpan) nameSpan.textContent = name ? `, ${name}` : '';
    }

    // El nombre se guarda en el servidor junto al resto de los ajustes, así que
    // te saluda igual desde el celular que desde la compu.
    window.api.getSettings()
        .then(settings => {
            if (!settings) return;

            // El nombre propio del usuario (userName) siempre pisa el de
            // marca (clientName): este último es solo el saludo por
            // defecto de una instancia recién entregada a un cliente.
            if (settings.userName) {
                defaultUser.displayName = settings.userName;
                paintName(settings.userName);
            } else if (settings.clientName) {
                defaultUser.displayName = settings.clientName;
                paintName(settings.clientName);
            }

            if (settings.clientName) {
                document.title = `${settings.clientName} · Personal Count`;
            }

            // Un solo color de acento cascadea por botones, header, barra
            // de presupuesto y primer color del gráfico sin tocar el resto
            // del sistema de diseño de jArismendi®.
            if (settings.clientAccentColor) {
                const root = document.documentElement.style;
                root.setProperty('--petrol', settings.clientAccentColor);
                root.setProperty('--income', settings.clientAccentColor);
                root.setProperty('--petrol-deep', darkenHex(settings.clientAccentColor, 0.63));
                root.setProperty('--petrol-ink', darkenHex(settings.clientAccentColor, 0.43));
                root.setProperty('--petrol-light', lightenHex(settings.clientAccentColor, 0.55));

                // Activa el look "etéreo" del dashboard y la navegación de
                // esta instancia (ver estilos.css, bloque body.client-branded).
                // La instancia de jA no lleva esta clase, así que sigue
                // exactamente igual que antes.
                document.body.classList.add('client-branded');
            }

            if (settings.clientLogoUrl) {
                defaultUser.photoURL = settings.clientLogoUrl;
                if (profileImgEl) profileImgEl.src = settings.clientLogoUrl;
            }
        })
        .catch(() => { /* refreshData ya avisa si el servidor no responde */ });

    // Load initial state
    paintName(defaultUser.displayName);
    if (profileImgEl) profileImgEl.src = defaultUser.photoURL;

    // Allow editing name by clicking the greeting
    if (userNameEl) {
        userNameEl.addEventListener('click', async () => {
            const newName = prompt("¿Cómo te gustaría que te llame?", defaultUser.displayName);
            if (newName && newName.trim() !== "") {
                // Update UI
                defaultUser.displayName = newName;
                paintName(newName);

                try {
                    await window.api.putSetting('userName', newName);
                    showToast(`Nombre actualizado a ${newName}`, 'success');
                } catch (e) {
                    showToast(e.message || 'No se pudo guardar el nombre.', 'error');
                }
            }
        });
    }

    // Se sacó el aviso de "poné tu nombre". Existía para empujar al usuario
    // fuera de "Invitado" y ya no hace falta: la app arranca con el nombre
    // puesto. Además saltaba cada vez que se abría, porque la comprobación
    // corría antes de que llegara el nombre guardado del servidor.

    console.log("Sistema de autenticación y perfil local inicializado.");
}

window.setupAuth = setupAuth;
