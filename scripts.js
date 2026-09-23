const USERS = [
    { user: 'Operaciones',   pass: 'AdminAlvaco2026' },
    // ↑ agrega el resto de tus 15 regiones siguiendo el mismo formato
];

const SESSION_KEY = 'muñelocos_session';

/* -------------------------------------------------------------------------
   DOMINIOS QUE NUNCA SE PUEDEN MOSTRAR DENTRO DE UN IFRAME
   -------------------------------------------------------------------------
   Power BI, SharePoint/OneDrive y Lucidchart exigen iniciar sesión, y por
   seguridad esas páginas de inicio de sesión de Microsoft (y de Lucid)
   bloquean que se muestren dentro de un iframe ajeno — es una protección
   anti-clickjacking del lado de ellos, no algo que se pueda evitar desde
   aquí. Para esos casos, en vez de mostrar un panel en blanco, se abre
   directamente una pestaña nueva.
------------------------------------------------------------------------- */
const NO_EMBED_HOSTS = [
    'powerbi.com',
    'sharepoint.com',
    'live.com',
    'office.com',
    'lucid.app',
    'lucidchart.com',
];

function shouldEmbed(url) {
    try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase();
        if (host === 'app.powerbi.com' && (u.pathname.startsWith('/view') || u.pathname.startsWith('/reportEmbed'))) {
            return true;
        }
        if (host.endsWith('sharepoint.com') && u.searchParams.get('action') === 'embedview') {
            return true;
        }
        if (host === 'onedrive.live.com' && u.pathname.startsWith('/embed')) {
            return true;
        }

        return !NO_EMBED_HOSTS.some(blocked => host === blocked || host.endsWith('.' + blocked));
    } catch {
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {

    /* ============================ LOGIN ============================ */
    const loginScreen = document.getElementById('loginScreen');
    const appShell     = document.getElementById('appShell');
    const loginForm    = document.getElementById('loginForm');
    const loginUserSel = document.getElementById('loginUser');
    const loginPassInp = document.getElementById('loginPass');
    const loginError   = document.getElementById('loginError');
    const togglePass   = document.getElementById('togglePass');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const logoutBtn    = document.getElementById('logoutBtn');

    // Poblar el <select> con los usuarios definidos arriba
    USERS.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.user;
        opt.textContent = u.user;
        loginUserSel.appendChild(opt);
    });

    function enterApp(userName) {
        sidebarUserName.textContent = userName;
        loginScreen.classList.add('hidden');
        appShell.classList.remove('hidden');
    }

    // ¿Ya había una sesión abierta en esta pestaña del navegador?
    const savedSession = sessionStorage.getItem(SESSION_KEY);
    if (savedSession) {
        enterApp(savedSession);
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userVal = loginUserSel.value;
        const passVal = loginPassInp.value;

        const match = USERS.find(u => u.user === userVal && u.pass === passVal);

        if (match) {
            sessionStorage.setItem(SESSION_KEY, match.user);
            loginError.textContent = '';
            enterApp(match.user);
            loginForm.reset();
        } else {
            loginError.textContent = 'Usuario o contraseña incorrectos. Verifica e intenta de nuevo.';
            const card = document.querySelector('.login-card');
            card.classList.remove('shake');
            void card.offsetWidth; // reinicia la animación
            card.classList.add('shake');
        }
    });

    togglePass.addEventListener('click', () => {
        const isPass = loginPassInp.type === 'password';
        loginPassInp.type = isPass ? 'text' : 'password';
        togglePass.innerHTML = isPass ? '<i class="fa fa-eye-slash"></i>' : '<i class="fa fa-eye"></i>';
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem(SESSION_KEY);
        location.reload();
    });

    /* ========================= NAVEGACIÓN ========================== */
    const sidebar    = document.getElementById('sidebar');
    const menuBtn    = document.getElementById('menuBtn');
    const tabs       = document.querySelectorAll('.tab-link');
    const contents   = document.querySelectorAll('.tab-content');
    const pageTitle  = document.querySelector('.page-title');
    const quickFilter = document.getElementById('quickFilter');

    window.showTab = function (tabId, title) {
        contents.forEach(c => c.classList.remove('active'));
        tabs.forEach(t => t.classList.remove('active'));

        const targetContent = document.getElementById(tabId);
        const targetTab = document.querySelector(`.tab-link[data-tab="${tabId}"]`);

        if (targetContent) targetContent.classList.add('active');
        if (targetTab) targetTab.classList.add('active');
        if (title) pageTitle.innerText = title;

        document.querySelector('.main-body').scrollTop = 0;

        // limpiar el buscador al cambiar de sección
        if (quickFilter) {
            quickFilter.value = '';
            filterButtons('');
        }

        if (window.innerWidth <= 1024) sidebar.classList.remove('active');
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            // los links que abren el visor (data-url) se manejan aparte
            if (this.dataset.url) return;
            const tabId = this.getAttribute('data-tab');
            const title = this.textContent.trim();
            showTab(tabId, title);
        });
    });

    menuBtn.addEventListener('click', () => sidebar.classList.toggle('active'));

    // Cerrar el menú móvil si se toca fuera de él
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024 &&
            sidebar.classList.contains('active') &&
            !sidebar.contains(e.target) &&
            !menuBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    /* ===================== REPORTE INCRUSTADO (fijo en la página, como el tab00) ===================== */
    const embedFrame = document.getElementById('embedFrame');
    const embedTitleEl = document.getElementById('embedTitle');
    const embedBack = document.getElementById('embedBack');

    let lastTabId = 'tab00';
    let lastTabTitle = 'Menu';

    function openEmbedded(url, title) {
        // Recuerda desde dónde llegamos, para que "Volver" regrese ahí
        const current = document.querySelector('.tab-content.active');
        if (current && current.id !== 'tabEmbed') {
            lastTabId = current.id;
            const activeLink = document.querySelector('.tab-link.active');
            lastTabTitle = activeLink ? activeLink.textContent.trim() : pageTitle.textContent;
        }

        embedFrame.src = url;
        embedTitleEl.textContent = title || '';
        showTab('tabEmbed', title || 'Reporte');
    }

    if (embedBack) {
        embedBack.addEventListener('click', () => showTab(lastTabId, lastTabTitle));
    }

    /* ===================== ABRIR EN PESTAÑA NUEVA (con aviso) ===================== */
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toastText');
    let toastTimer = null;

    function showToast(message) {
        toastText.textContent = message;
        toast.classList.add('active');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('active'), 2200);
    }

    function openExternal(url, title) {
        // window.open debe llamarse de forma síncrona dentro del evento de clic,
        // si no el navegador lo trata como pop-up y lo bloquea.
        window.open(url, '_blank', 'noopener');
        showToast(`Abriendo "${title || 'reporte'}" en una pestaña nueva…`);
    }

    // Decide automáticamente: si el link permite iframe (por ejemplo, un
    // reporte "Publicado en la Web" de Power BI), se muestra fijo en la
    // página; si no (Power BI normal, SharePoint, Lucidchart...), se abre
    // en pestaña nueva.
    function openLink(url, title) {
        if (shouldEmbed(url)) {
            openEmbedded(url, title);
        } else {
            openExternal(url, title);
        }
    }

    // Delegación de eventos: cualquier botón/link con data-action
    document.addEventListener('click', (e) => {
        const el = e.target.closest('[data-action]');
        if (!el) return;

        if (el.classList.contains('disabled')) return;

        const action = el.dataset.action;
        if (action === 'viewer') {
            e.preventDefault();
            openLink(el.dataset.url, el.dataset.title);
        } else if (action === 'tab') {
            e.preventDefault();
            showTab(el.dataset.tab, el.dataset.title);
        }
    });

    // Los tab-link del sidebar marcados con .js-viewer también usan la misma lógica
    document.querySelectorAll('.tab-link.js-viewer').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openLink(link.dataset.url, link.dataset.title);
        });
    });

    /* ===================== BUSCADOR RÁPIDO ===================== */
    function normalize(str) {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function filterButtons(query) {
        const q = normalize(query.trim());
        const activeTab = document.querySelector('.tab-content.active');
        if (!activeTab) return;

        activeTab.querySelectorAll('.btn-big').forEach(btn => {
            const label = btn.querySelector('.label');
            const text = label ? normalize(label.textContent) : '';
            const visible = !q || text.includes(q);
            btn.classList.toggle('is-filtered-out', !visible);
        });
    }

    if (quickFilter) {
        quickFilter.addEventListener('input', () => filterButtons(quickFilter.value));
    }
});

/* =========================================================================
   NOTA DE SEGURIDAD
   -------------------------------------------------------------------------
   Este login es un filtro de cortesía, no un sistema de seguridad real:
   como todo el código corre en el navegador, cualquiera que sepa ver el
   código fuente puede leer los usuarios y contraseñas de USERS. Sirve para
   evitar que alguien entre "por accidente" o sin invitación, pero NO
   protege información confidencial.

   Los reportes de Power BI y los archivos de SharePoint que se abren desde
   aquí ya piden el inicio de sesión de Microsoft de cada persona, así que
   la protección real de esos datos sigue estando del lado de Microsoft 365.
   Si más adelante quieres control de acceso de verdad (por ejemplo, que
   solo cierta gente vea ciertos botones), lo ideal es integrar un inicio de
   sesión con Azure AD / Microsoft Entra ID en vez de esta lista de
   contraseñas en texto plano.

   Por la misma razón, los reportes de Power BI, SharePoint/OneDrive y
   Lucidchart NO se pueden mostrar dentro de un panel/iframe: sus páginas de
   inicio de sesión bloquean activamente que se les incruste en otro sitio
   (protección anti-clickjacking). Por eso esos enlaces se abren en una
   pestaña nueva (ver NO_EMBED_HOSTS arriba) en vez de en el visor.
   ========================================================================= */