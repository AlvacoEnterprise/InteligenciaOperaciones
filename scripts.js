/* =========================================================================
   INTELIGENCIA DE OPERACIONES · MUÑELOCOS
   -------------------------------------------------------------------------
   1) Login muy sencillo (solo del lado del cliente, ver nota de seguridad
      al final de este archivo).
   2) Navegación por pestañas.
   3) Visor de contenido externo (Power BI / SharePoint / Lucidchart) en
      un iframe modal, en vez de abrir una pestaña nueva.
   4) Buscador rápido de botones dentro de la sección activa.
   ========================================================================= */

/* -------------------------------------------------------------------------
   1) USUARIOS Y CONTRASEÑAS
   -------------------------------------------------------------------------
   Agrega / edita filas aquí. Cada usuario es un objeto { user, pass }.
   Sugerencia de patrón: "<ClaveRegión>Alvaco2026".
   Ejemplo: Baja California -> BCAlvaco2026
------------------------------------------------------------------------- */
const USERS = [
    { user: 'Administración',   pass: 'AdminAlvaco2026' },
    { user: 'Baja California',  pass: 'BCAlvaco2026' },
    { user: 'Centro Este',      pass: 'CEAlvaco2026' },
    { user: 'Centro Occidente', pass: 'COAlvaco2026' },
    { user: 'Operaciones',      pass: 'OpsAlvaco2026' },
    { user: 'Sureste',          pass: 'SEAlvaco2026' },
    // ↑ agrega el resto de tus 15 regiones siguiendo el mismo formato
];

const SESSION_KEY = 'muñelocos_session';

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

    /* ===================== VISOR EN IFRAME (modal) ===================== */
    const viewerOverlay  = document.getElementById('viewerOverlay');
    const viewerFrame    = document.getElementById('viewerFrame');
    const viewerTitle    = document.getElementById('viewerTitle');
    const viewerExternal = document.getElementById('viewerExternal');
    const viewerLoader   = document.getElementById('viewerLoader');
    const viewerClose    = document.getElementById('viewerClose');

    function openViewer(url, title) {
        viewerTitle.textContent = title || 'Contenido';
        viewerExternal.href = url;
        viewerLoader.classList.add('active');
        viewerFrame.src = url;
        viewerOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeViewer() {
        viewerOverlay.classList.remove('active');
        viewerFrame.src = 'about:blank';
        document.body.style.overflow = '';
    }

    viewerFrame.addEventListener('load', () => viewerLoader.classList.remove('active'));
    viewerClose.addEventListener('click', closeViewer);

    viewerOverlay.addEventListener('click', (e) => {
        if (e.target === viewerOverlay) closeViewer();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && viewerOverlay.classList.contains('active')) closeViewer();
    });

    // Delegación de eventos: cualquier botón/link con data-action
    document.addEventListener('click', (e) => {
        const el = e.target.closest('[data-action]');
        if (!el) return;

        if (el.classList.contains('disabled')) return;

        const action = el.dataset.action;
        if (action === 'viewer') {
            e.preventDefault();
            openViewer(el.dataset.url, el.dataset.title);
        } else if (action === 'tab') {
            e.preventDefault();
            showTab(el.dataset.tab, el.dataset.title);
        }
    });

    // Los tab-link del sidebar marcados con .js-viewer también abren el visor
    document.querySelectorAll('.tab-link.js-viewer').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openViewer(link.dataset.url, link.dataset.title);
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
   ========================================================================= */