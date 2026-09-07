// Branding público de la instancia — sin auth a propósito: hace falta en
// login.html, antes de que exista sesión. No expone nada sensible, son los
// mismos valores que ya son visibles en el dashboard una vez logueado.
module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const branding = {};
    if (process.env.CLIENT_NAME) branding.clientName = process.env.CLIENT_NAME;
    if (process.env.CLIENT_ACCENT_COLOR) branding.clientAccentColor = process.env.CLIENT_ACCENT_COLOR;
    if (process.env.CLIENT_LOGO_URL) branding.clientLogoUrl = process.env.CLIENT_LOGO_URL;

    res.status(200).json(branding);
};
