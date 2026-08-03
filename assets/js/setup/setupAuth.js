// Local Auth & Profile Management
// Handles user identity (mock) and persistent profile settings (Name/Photo)

const defaultUser = {
    uid: "local-user-v1",
    displayName: "Invitado",
    photoURL: "assets/img/avatar.jpg",
    email: "local@app.com"
};

window.auth = {
    currentUser: defaultUser,
    onAuthStateChanged: async (callback) => {
        // Load user settings from DB if available
        if (window.db) {
            try {
                const nameSetting = await window.db.settings.get('userName');
                if (nameSetting) defaultUser.displayName = nameSetting.value;

                // We could also store avatar URL
            } catch (e) {
                console.log("Could not load user settings yet");
            }
        }

        callback(defaultUser);
        return () => { };
    },
    signOut: () => window.location.reload()
};

function setupAuth() {
    const userNameEl = document.querySelector('.greeting'); // The entire h1
    const nameSpan = document.getElementById('user-name');
    const profileImgEl = document.getElementById('profile-img');

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

                // Save to DB
                if (window.db) {
                    await window.db.settings.put({ key: 'userName', value: newName });
                    showToast(`Nombre actualizado a ${newName}`, 'success');
                }
            }
        });
    }

    // Proactive hint if user is still "Invitado"
    if (defaultUser.displayName === 'Invitado') {
        setTimeout(() => {
            if (typeof showToast === 'function') {
                showToast('Tip: Haz clic en "Hola, Invitado" para poner tu nombre.', 'info');
            }
        }, 2000);
    }

    console.log("Sistema de autenticación y perfil local inicializado.");
}

window.setupAuth = setupAuth;
