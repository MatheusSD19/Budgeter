// Budgeter - Main App
// Inicialização e coordenação de todos os módulos

class App {
    constructor() {
        this.db = window.db;
        this.authManager = window.authManager;
        
        this.state = {
            unidadeSelecionada: null,
            unidades: {}
        };

        this.toastContainer = null;
    }

    async init() {
        // Cria container de toasts
        this.createToastContainer();

        // Aguarda autenticação
        window.addEventListener('auth:ready', async (e) => {
            console.log('App ready, user:', e.detail.user.email);
            await this.onAuthReady();
        });

        // Setup eventos globais
        window.addEventListener('app:toast', (e) => {
            this.showToast(e.detail.message, e.detail.type);
        });

        // Toggle sidebar
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Seletor de unidade
        const unidadeSelect = document.getElementById('unidade-select');
        if (unidadeSelect) {
            unidadeSelect.addEventListener('change', (e) => this.onUnidadeChange(e.target.value));
        }
    }

    async onAuthReady() {
        // Inicializa componentes
        if (window.initTree) {
            window.initTree();
            
            // Setup callback de seleção
            window.treeComponent.onSelect((item) => {
                window.dispatchEvent(new CustomEvent('tree:select', { detail: item }));
            });
        }

        if (window.initBudgetEditor) {
            window.initBudgetEditor();
        }

        // Carrega unidades disponíveis
        await this.loadUnidades();
    }

    async loadUnidades() {
        try {
            const unidades = await this.db.getUnidades();
            this.state.unidades = unidades;

            // Filtra unidades que o usuário tem acesso
            const userUnidades = window.authManager.userUnidades;
            const isAdmin = window.authManager.isAdmin;

            const unidadesDisponiveis = Object.values(unidades).filter(u => {
                return isAdmin || userUnidades.includes(u.id);
            });

            // Preenche select
            const select = document.getElementById('unidade-select');
            select.innerHTML = '<option value="">Selecione a unidade...</option>';

            unidadesDisponiveis.forEach(u => {
                const option = document.createElement('option');
                option.value = u.id;
                option.textContent = u.nome;
                select.appendChild(option);
            });

            // Seleciona primeira unidade automaticamente se só tiver uma
            if (unidadesDisponiveis.length === 1) {
                select.value = unidadesDisponiveis[0].id;
                this.onUnidadeChange(unidadesDisponiveis[0].id);
            }
        } catch (error) {
            console.error('Erro ao carregar unidades:', error);
            this.showToast('Erro ao carregar unidades', 'error');
        }
    }

    async onUnidadeChange(unidadeId) {
        if (!unidadeId) {
            this.state.unidadeSelecionada = null;
            if (window.treeComponent) {
                window.treeComponent.loadUnidade(null);
            }
            return;
        }

        this.state.unidadeSelecionada = unidadeId;

        // Atualiza árvore
        if (window.treeComponent) {
            await window.treeComponent.loadUnidade(unidadeId);
            window.treeComponent.expandAll();
        }

        // Atualiza breadcrumb
        const unidade = this.state.unidades[unidadeId];
        if (unidade) {
            document.getElementById('breadcrumb-unidade').textContent = unidade.nome;
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
        
        // Em mobile, usa classe diferente
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('open');
        }
    }

    createToastContainer() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.className = 'toast-container';
        document.body.appendChild(this.toastContainer);
    }

    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#10b981" stroke-width="2"><path d="M4 10l4 4 8-8"/></svg>',
            error: '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="10" cy="10" r="8"/><path d="M7 7l6 6M13 7l-6 6"/></svg>',
            warning: '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10 4l6 10H4z"/><path d="M10 9v3"/></svg>',
            info: '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#3b82f6" stroke-width="2"><circle cx="10" cy="10" r="8"/><path d="M10 6v4M10 14h.01"/></svg>'
        };

        toast.innerHTML = `
            ${icons[type] || icons.info}
            <span>${message}</span>
        `;

        this.toastContainer.appendChild(toast);

        // Remove após duração
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// Inicializa app quando DOM estiver pronto
let app;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new App();
        app.init();
        window.app = app;
    });
} else {
    app = new App();
    app.init();
    window.app = app;
}

export default App;
