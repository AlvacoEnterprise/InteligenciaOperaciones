document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menuBtn');
    const tabs = document.querySelectorAll('.tab-link');
    const contents = document.querySelectorAll('.tab-content');
    const pageTitle = document.querySelector('.page-title');

    window.showTab = function(tabId, title) {
        // Ocultar contenidos y quitar estados activos
        contents.forEach(content => content.classList.remove('active'));
        tabs.forEach(tab => tab.classList.remove('active'));

        // Activar el nuevo contenido
        const targetContent = document.getElementById(tabId);
        const targetTab = document.querySelector(`[data-tab="${tabId}"]`);

        if (targetContent) targetContent.classList.add('active');
        if (targetTab) targetTab.classList.add('active');
        
        // Cambiar título superior
        if (title) pageTitle.innerText = title;

        // Resetear el scroll del contenedor principal al cambiar de pestaña
        document.querySelector('.main-body').scrollTop = 0;

        // Cerrar menú móvil
        if (window.innerWidth <= 1024) {
            sidebar.classList.remove('active');
        }
    };

    // Asignar eventos a los links laterales
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            if (this.tagName === 'A') return; // Evitar que el buscador interfiera
            const tabId = this.getAttribute('data-tab');
            const title = this.innerText.trim();
            showTab(tabId, title);
        });
    });

    // Toggle del menú hamburguesa
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
});