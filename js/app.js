// Budgeter - App (v2)
// Coordena: seleção de Filial + Ano, navegação, eventos globais e toasts.

import db from './database.js';

class App {
    constructor() {
        this.state = {
            filialId: null,
            ano: new Date().getFullYear(),
            filiais: {},
        };
        this.toastContainer = null;
    }

    async init() {
        this.createToastContainer();
        window.addEventListener('app:toast', (e) => this.showToast(e.detail.message, e.detail.type));

        const sidebarToggle = document.getElementById('sidebar-toggle');
        sidebarToggle?.addEventListener('click', () => this.toggleSidebar());

        const filialSelect = document.getElementById('filial-select');
        filialSelect?.addEventListener('change', (e) => this.onFilialChange(e.target.value));

        const anoSelect = document.getElementById('ano-select');
        anoSelect?.addEventListener('change', (e) => this.onAnoChange(e.target.value));

        window.addEventListener('auth:ready', () => this.onAuthReady());
    }

    async onAuthReady() {
        if (window.initTree) {
            window.initTree();
            window.treeComponent.onSelect((item) => {
                window.dispatchEvent(new CustomEvent('tree:select', { detail: item }));
            });
        }
        if (window.initBudgetEditor) window.initBudgetEditor();

        await this.loadConfig();
        await this.loadFiliais();
        this.populateAnoSelect();
    }

    async loadConfig() {
        try {
            const fb = window.firebase;
            const snap = await fb.get(fb.ref(fb.db, 'config'));
            const cfg = snap.exists() ? snap.val() : {};
            if (cfg.anoAtual) this.state.ano = cfg.anoAtual;
        } catch (err) {
            console.warn('Sem config inicial, usando defaults', err);
        }
    }

    async loadFiliais() {
        try {
            const filiais = await db.getFiliais();
            this.state.filiais = filiais;

            const userFiliais = window.authManager.userFiliais; // null = todas
            const list = Object.values(filiais).filter((f) => {
                if (!f.ativo && f.ativo !== undefined) return false;
                return userFiliais === null || userFiliais.includes(f.id);
            });

            const select = document.getElementById('filial-select');
            if (!select) return;
            select.innerHTML = '<option value="">Filial...</option>';
            list.forEach((f) => {
                const opt = document.createElement('option');
                opt.value = f.id;
                opt.textContent = f.nome + (f.codigo ? ` (${f.codigo})` : '');
                select.appendChild(opt);
            });

            if (list.length === 1) {
                select.value = list[0].id;
                this.onFilialChange(list[0].id);
            } else if (list.length === 0) {
                this.showToast('Nenhuma filial disponível. Use o painel Admin para cadastrar.', 'warning', 6000);
            }
        } catch (err) {
            console.error('Erro ao carregar filiais:', err);
            this.showToast('Erro ao carregar filiais', 'error');
        }
    }

    populateAnoSelect() {
        const select = document.getElementById('ano-select');
        if (!select) return;
        const atual = this.state.ano;
        select.innerHTML = '';
        for (let y = atual - 2; y <= atual + 2; y++) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            if (y === atual) opt.selected = true;
            select.appendChild(opt);
        }
    }

    async onFilialChange(filialId) {
        this.state.filialId = filialId;
        const filial = this.state.filiais[filialId];
        const breadcrumb = document.getElementById('breadcrumb-filial');
        if (breadcrumb) breadcrumb.textContent = filial?.nome || 'Filial';

        window.dispatchEvent(new CustomEvent('app:filial-change', { detail: { filialId } }));

        if (window.treeComponent) {
            await window.treeComponent.loadFilial(filialId, this.state.ano);
            window.treeComponent.expandAll();
        }
    }

    async onAnoChange(ano) {
        this.state.ano = Number(ano);
        window.dispatchEvent(new CustomEvent('app:ano-change', { detail: { ano: this.state.ano } }));
        if (window.treeComponent && this.state.filialId) {
            await window.treeComponent.loadFilial(this.state.filialId, this.state.ano);
            window.treeComponent.expandAll();
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        sidebar.classList.toggle('collapsed');
        if (window.innerWidth <= 768) sidebar.classList.toggle('open');
    }

    createToastContainer() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.className = 'toast-container';
        document.body.appendChild(this.toastContainer);
    }

    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        this.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

let app;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { app = new App(); app.init(); window.app = app; });
} else {
    app = new App(); app.init(); window.app = app;
}

export default App;
