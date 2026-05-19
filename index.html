// Budgeter - Tree Component
// Navegação hierárquica: Unidade → Setores → Centros de Custo

class TreeComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.db = window.db;
        
        this.data = {
            unidade: null,
            setores: {},
            centrosCusto: {}
        };
        
        this.expanded = new Set();
        this.selected = null;
        
        this.onSelectCallback = null;
    }

    async loadUnidade(unidadeId) {
        if (!unidadeId) {
            this.container.innerHTML = '<div class="empty-state"><p>Selecione uma unidade</p></div>';
            return;
        }

        // Carrega dados
        this.data.unidade = await this.db.getUnidade(unidadeId);
        this.data.setores = await this.db.getSetores(unidadeId);
        
        // Carrega centros de custo de todos os setores
        for (const setorId of Object.keys(this.data.setores)) {
            this.data.centrosCusto[setorId] = await this.db.getCentrosCusto(setorId);
        }
        
        this.render();
    }

    render() {
        if (!this.data.unidade) {
            this.container.innerHTML = '<div class="empty-state"><p>Selecione uma unidade</p></div>';
            return;
        }

        const tree = document.createElement('div');
        tree.className = 'tree';

        // Nível 0: Unidade
        const unidadeItem = this.createTreeItem({
            id: this.data.unidade.id,
            nome: this.data.unidade.nome,
            level: 0,
            type: 'unidade',
            expandable: true,
            expanded: this.expanded.has(this.data.unidade.id)
        });
        tree.appendChild(unidadeItem);

        // Nível 1: Setores (se expandido)
        if (this.expanded.has(this.data.unidade.id)) {
            const setoresOrdenados = Object.values(this.data.setores)
                .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

            for (const setor of setoresOrdenados) {
                const setorItem = this.createTreeItem({
                    id: setor.id,
                    nome: setor.nome,
                    level: 1,
                    type: 'setor',
                    expandable: true,
                    expanded: this.expanded.has(setor.id),
                    parentId: this.data.unidade.id
                });
                tree.appendChild(setorItem);

                // Nível 2: Centros de Custo (se expandido)
                if (this.expanded.has(setor.id)) {
                    const centros = Object.values(this.data.centrosCusto[setor.id] || {})
                        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

                    for (const cc of centros) {
                        const ccItem = this.createTreeItem({
                            id: cc.id,
                            nome: cc.nome,
                            level: 2,
                            type: 'centroCusto',
                            expandable: false,
                            parentId: setor.id,
                            data: cc
                        });
                        tree.appendChild(ccItem);
                    }
                }
            }
        }

        this.container.innerHTML = '';
        this.container.appendChild(tree);
    }

    createTreeItem({ id, nome, level, type, expandable, expanded, parentId, data }) {
        const item = document.createElement('div');
        item.className = `tree-item level-${level}`;
        item.dataset.id = id;
        item.dataset.type = type;
        
        if (this.selected === id) {
            item.classList.add('selected');
        }

        // Toggle icon
        if (expandable) {
            const toggle = document.createElement('span');
            toggle.className = `tree-toggle ${expanded ? 'expanded' : ''}`;
            toggle.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 2.5L8 6L4.5 9.5"/></svg>`;
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleExpand(id);
            });
            item.appendChild(toggle);
        } else {
            const spacer = document.createElement('span');
            spacer.style.width = '16px';
            item.appendChild(spacer);
        }

        // Icon
        const icon = document.createElement('span');
        icon.className = 'tree-icon';
        icon.innerHTML = this.getIconForType(type);
        item.appendChild(icon);

        // Label
        const label = document.createElement('span');
        label.className = 'tree-label';
        label.textContent = nome;
        item.appendChild(label);

        // Status indicator (placeholder)
        const status = document.createElement('span');
        status.className = 'tree-status';
        item.appendChild(status);

        // Click handler
        item.addEventListener('click', () => {
            this.selectItem(id, type, data);
        });

        return item;
    }

    getIconForType(type) {
        const icons = {
            unidade: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a2 2 0 012-2h4a2 2 0 012 2v9"/></svg>`,
            setor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
            centroCusto: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`
        };
        return icons[type] || '';
    }

    toggleExpand(id) {
        if (this.expanded.has(id)) {
            this.expanded.delete(id);
        } else {
            this.expanded.add(id);
        }
        this.render();
    }

    selectItem(id, type, data) {
        this.selected = id;
        this.render();

        if (this.onSelectCallback) {
            this.onSelectCallback({ id, type, data });
        }
    }

    onSelect(callback) {
        this.onSelectCallback = callback;
    }

    expandAll() {
        if (this.data.unidade) {
            this.expanded.add(this.data.unidade.id);
            Object.keys(this.data.setores).forEach(id => {
                this.expanded.add(id);
            });
        }
        this.render();
    }

    collapseAll() {
        this.expanded.clear();
        if (this.data.unidade) {
            this.expanded.add(this.data.unidade.id);
        }
        this.render();
    }
}

// Singleton instance
let treeComponent;
function initTree() {
    treeComponent = new TreeComponent('tree-container');
    window.treeComponent = treeComponent;
    return treeComponent;
}

window.initTree = initTree;

export { TreeComponent, initTree };
