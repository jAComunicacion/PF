---
name: onboard-client
description: Da de alta una instancia nueva de Personal Count para un cliente de jA Comunicación (pyme o autónomo) — infraestructura dedicada (Neon + Vercel + DNS) más el branding liviano de esa instancia. Usar cuando Julio pida "personalizar la app para [cliente]", "dar de alta a [cliente] en Personal Count", o llevar esta app a un cliente nuevo.
---

Da de alta una instancia dedicada de Personal Count para un cliente nuevo.
Modelo "instancia por cliente" (no multi-tenant, ver `README.md` — sección
"Alta de un cliente nuevo"): cada cliente tiene su propia base Neon, su
propio proyecto Vercel y su propio subdominio, todos desplegando el mismo
repo/rama `main`. Esta skill cubre las DOS mitades del trabajo:
**infraestructura** (que exista y funcione) y **branding** (que se vea del
cliente, no de jA) — la primera vez que se hizo esto (Miriam Schild,
07-sep-2026) sirvió de base para escribir esta skill.

Todos los pasos de infraestructura ya están documentados como checklist en
`README.md` → "Alta de un cliente nuevo (modelo 'instancia por cliente')".
Esta skill no lo repite — lo referencia y agrega lo que el README no cubre:
las trampas reales que aparecieron la primera vez, y el branding.

## Antes de arrancar: preguntas a Julio

No asumir nada de esto — confirmarlo primero (siguiendo el patrón de
"hacé preguntas hasta acordar" que ya usa Julio en estas sesiones):

1. **Subdominio**: ¿bajo el dominio del cliente (`finanzas.<cliente>.com`,
   recomendado si jA administra ese DNS) o bajo `jacomunicacion.com.ar`? Ver
   el razonamiento ya dado una vez: la identidad del cliente es la
   prioritaria (jArismendi® trabaja "de la empresa hacia el mercado"), así
   que por defecto va bajo el dominio del cliente.
2. **¿Quién administra el DNS de ese dominio?** Si es Donweb/Hostmar (caso
   Miriam Schild), el panel de "Crear subdominio" no es un editor de DNS
   directo — es un wizard con "Acción: Redireccionar a...". La opción
   correcta para un registro A es **"Redireccionar a una IP"**, no "a una
   URL" (eso es un redirect HTTP real, rompe TLS) ni "a un dominio" (eso es
   más parecido a un CNAME).
3. **Categorías**: ¿las por defecto del seed, o hace falta relevar un plan
   de categorías a medida con el cliente?
4. **Assets de marca**: pedir el color de acento (un solo hex alcanza,
   ver más abajo cómo se derivan los demás) y el logo del cliente. Buscar
   primero en la carpeta del cliente en disco (`E:\CLIENTES\...` o
   `E:\jA COMUNICACION Diseño & Marketing\...`) — casi siempre ya existe
   un favicon o isotipo circular de una web/etiqueta/redes sociales
   armado previamente. Preferir una versión ya pensada para verse chica
   (favicon, ícono de WhatsApp) por sobre un logotipo horizontal ancho:
   el único lugar donde se usa es el avatar circular de 54px.

## Infraestructura (Neon + Vercel + DNS)

Seguir el checklist de `README.md`. Herramientas usadas la primera vez
(todas con sesión ya autenticada en esta máquina):

- `npx neonctl projects create --name "<Cliente> - Finanzas" --org-id <org> --region-id aws-us-east-2`
- `vercel project add <cliente>-finanzas`
- Para correr comandos de Vercel contra el proyecto nuevo SIN romper el
  link local a tu propio proyecto (`finanzas`): respaldar
  `.vercel/project.json`, `vercel link --project <cliente>-finanzas --yes`,
  correr el comando, restaurar el backup. `vercel env add` y
  `vercel deploy --prod` sí aceptan `--project <nombre>` directo, pero
  `vercel git connect` y `vercel domains add` necesitan el link temporal.
- Migraciones: correr `db/001_init.sql` y `002_settings.sql` (nunca
  `003_reset_categorias.sql` — ese es un fix puntual ya aplicado a la base
  de Julio, no un paso de instalación).
- `vercel domains add <subdominio> <proyecto>` y después
  `vercel domains inspect <subdominio>` para ver el registro exacto que
  pide (típicamente `A <subdominio> 76.76.21.21`, a veces un CNAME).

### La trampa del certificado HTTPS

`vercel domains verify <dominio>` puede tardar mucho en pasar de
`invalid_configuration` a `ok` aunque el DNS ya esté propagado y
verificado desde afuera (confirmar con
`curl -sS "https://dns.google/resolve?name=<dominio>&type=A"` — si ya
devuelve la IP correcta, el DNS está bien). Y aunque `verify` diga `"ok"`,
el certificado TLS puede seguir sin emitirse: la conexión HTTPS falla con
"failed to receive handshake" / "socket disconnected before secure TLS
connection was established" en vez de servir la página.

**No esperar pasivamente.** Forzar la emisión:

```
vercel certs issue <dominio>
```

Después de esto, HTTPS empieza a responder en segundos. Este fue
justamente el problema no trivial que Julio recordaba de la instancia de
jA — no es un caso aislado, esperar que Vercel lo dispare solo puede
tardar mucho más de lo necesario.

## Branding

Mecanismo: tres variables de entorno opcionales, leídas server-side y
expuestas al frontend por dos endpoints (`/api/settings`, autenticado,
para `index.html`; `/api/branding`, público, para `login.html` — hace
falta ahí porque carga antes de que exista sesión). Sin definirlas, la
instancia se ve exactamente como la de jA — este mecanismo es aditivo,
nunca to toca el look por defecto.

| Variable | Qué hace |
|---|---|
| `CLIENT_NAME` | Nombre del cliente: saludo por defecto y título de pestaña |
| `CLIENT_ACCENT_COLOR` | Un solo hex — de ahí se derivan todos los demás tonos |
| `CLIENT_LOGO_URL` | Ruta del logo (ej. `assets/logos/<cliente>-logo.png`), reemplaza el avatar |

### De dónde sale el color

Buscar la paleta real del cliente antes de inventar nada — casi siempre ya
existe en su propia web (`style.css`, buscar `:root` y las variables
`--primary`/`--secondary`/etc.) o en sus artes de marca. Usar el color
**primario** de esa paleta como `CLIENT_ACCENT_COLOR`, no un secundario o
de acento — es el que después se deriva a todo lo demás.

`assets/js/setup/setupAuth.js` deriva del acento, en runtime, vía
`darkenHex()`/`lightenHex()` (mezcla de canal RGB con negro/blanco):

- `--petrol-deep` (63% del original) y `--petrol-ink` (43%) — para la
  tarjeta de saldo y demás usos oscuros.
- `--petrol-light` ("celeste", 55% mezclado con blanco) — para el
  porcentaje de Estado de Mis Finanzas y la navegación inferior.

No hace falta pedirle a Julio estos tonos derivados ni una segunda
variable de entorno — un solo hex alcanza. Si algún tono derivado no
queda bien (muy oscuro, muy pálido), ajustar el factor en
`darkenHex`/`lightenHex`, no agregar variables nuevas.

### Qué activa el branding

Con `CLIENT_ACCENT_COLOR` definido, el frontend agrega la clase
`body.client-branded`, que activa (todo en bloques `body.client-branded
...` en `assets/css/estilos.css` y `assets/css/login.css`, nunca
sobreescribiendo las reglas base):

- El degradé "etéreo" en la tarjeta de saldo (arranca en el acento
  intenso, se desvanece contra el papel) — los botones Pagar/Ingresos
  quedan flotando sobre el degradé, sin tarjeta blanca propia.
- Se apaga la marca de agua del isotipo de jA en `login.html` (queda el
  fondo sólido nomás) — la marca de agua es firma de jArismendi®, no del
  cliente.
- La firma "jA Comunicación" al pie del Dashboard/Transacciones/Gráficas
  (`.brand-mark`) NO se apaga nunca — es aparte del branding del cliente,
  queda siempre.

### Assets de marca

Los logos de cliente van en `assets/logos/`, con el nombre del cliente
(ej. `miriam-schild-logo.png`) — son archivos del cliente, no de
jArismendi®, y quedan inertes en el repo hasta que la instancia de ese
cliente define `CLIENT_LOGO_URL`. No hay problema en que convivan en el
mismo repo: el modelo es "instancia por cliente" en infraestructura, pero
sigue siendo un solo código fuente.

## Verificación antes de entregar

1. Confirmar HTTPS: `curl -sS -D - -o /dev/null "https://<subdominio>/login.html"` → `200 OK`, no error de handshake.
2. Cargar las tres variables de branding (si aplica) y hacer `vercel deploy --prod` (o push a `main`, que dispara el deploy automático — ver Gotcha abajo).
3. Verificar visualmente con Playwright simulando `/api/settings` y `/api/branding` (ver `.claude/skills/run-personal-count/SKILL.md` para el patrón del driver) antes de comitear — no alcanza con mirar el CSS, hay que verlo renderizado.
4. Pasarle a Julio: URL, `APP_PASSWORD`, y confirmación de que el branding se ve bien — la entrega al cliente final la hace él, manual (ver README).

## Gotcha: un solo repo, deploys compartidos

Todas las instancias (la de Julio y la de cada cliente) están conectadas
al mismo repo de GitHub en `main` vía Vercel. Un `git push` dispara el
deploy de **todas** las instancias a la vez — no hay forma de pushear
"solo para un cliente". Si Julio pide dejar un cambio pendiente de deploy
hasta que algo externo esté listo (ej. el DNS de un cliente todavía no
propagó), comitear en local igual (es seguro, no dispara nada) y esperar
su confirmación antes de hacer `git push`.
