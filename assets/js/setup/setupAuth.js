// Local Auth & Profile Management
// Handles user identity (mock) and persistent profile settings (Name/Photo)

// El nombre por defecto es el del dueño de la app, que hoy es un solo usuario.
// La costura para terceros ya existe y no hay que tocar nada acá: el ajuste
// `userName` guardado en el servidor pisa este valor, y se edita tocando el
// saludo. Cuando la app sea multiusuario, cada cuenta trae el suyo.
const defaultUser = {
    uid: "local-user-v1",
    displayName: "Julio",
    photoURL: "assets/logos/jacomunicacion.jpg",
    email: "local@app.com"
};

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

    // El nombre se guarda en el servidor junto al resto de los ajustes, así que
    // te saluda igual desde el celular que desde la compu.
    window.api.getSettings()
        .then(settings => {
            if (settings && settings.userName) {
                defaultUser.displayName = settings.userName;
                if (nameSpan) nameSpan.textContent = settings.userName;
            }
        })
        .catch(() => { /* refreshData ya avisa si el servidor no responde */ });

    // Load initial state
    if (nameSpan) nameSpan.textContent = defaultUser.displayName;
    if (profileImgEl) profileImgEl.src = defaultUser.photoURL;

    // Allow editing name by clicking the greeting
    if (userNameEl) {
        userNameEl.addEventListener('click', async () => {
            const newName = prompt("¿Cómo te gustaría que te llame?", defaultUser.displayName);
            if (newName && newName.trim() !== "") {
                // Update UI
                defaultUser.displayName = newName;
                if (nameSpan) nameSpan.textContent = newName;

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
