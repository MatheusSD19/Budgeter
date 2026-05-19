// Budgeter - Tree (v2)
// Hierarquia: Filial → Centro de Custo → Classe de Custo (apenas as que têm linhas no ano selecionado)
// Foco em navegação rápida; o editor faz o restante.

class TreeComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.data = { filial: null, centrosCusto: {}, classesUsadas: {} };
        this.expanded = new Set();
        this.selected = null;
        this.onSelectCallback = null;
        this.ano = new Date().getFullYear();
    }

    async loadFilial(filialId, ano) {
        if (ano) this.ano = ano;
        this.data = { filial: null, centrosCusto: {}, classesUsadas: {} };

        if (!filialId) {
            this.render();
            return;
        }

        const db = window.db;
        const filiais = await db.getFiliais();
        this.data.filial = filiais[filialId];
        this.data.centrosCusto = await db.getCentrosCustoFilial(filialId);

        // Descobre quais classes têm linhas para o ano (para mostrar só o relevante)
        const budget = await db.getBudgetFilial(this.ano, filialId);
        const classesUsadas = {};
        for (const [ccId, classes] of Object.entries(budget)) {
            classesUsadas[ccId] = Object.keys(classes);
        }
        this.data.classesUsadas = classesUsadas;
        this.data.classesCatalogo = await db.getClassesCusto();

        this.render();
    }

    render() {
        if (!this.container) return;
        if (!this.data.filial) {
            this.container.innerHTML = '<div class="tree-empty">Selecione uma filial</div>';
            return;
        }

        const tree = document.createElement('div');
        tree.className = 'tree';

        const filial = this.data.filial;
        tree.appendChild(this.createItem({
            id: filial.id,
            nome: filial.nome,
            badge: filial.codigo,
            level: 0,
            type: 'filial',
            expandable: true,
            expanded: this.expanded.has(filial.id),
        }));

        if (this.expanded.has(filial.id)) {
            const ccs = Object.values(this.data.centrosCusto)
                .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

            for (const cc of ccs) {
                const classesIds = this.data.classesUsadas[cc.id] || [];
                tree.appendChild(this.createItem({
                    id: cc.id,
                    nome: cc.nome,
                    badge: cc.codigo,
                    level: 1,
                    type: 'centroCusto',
                    expandable: classesIds.length > 0,
                    expanded: this.expanded.has(cc.id),
                    data: cc,
                }));

                if (this.expanded.has(cc.id)) {
                    for (const classeId of classesIds) {
                        const classe = this.data.classesCatalogo[classeId] || { codigo: classeId, descricao: 'Classe ' + classeId };
                        tree.appendChild(this.createItem({
                            id: `${cc.id}::${classeId}`,
                            nome: classe.descricao,
                            badge: classe.codigo,
                            level: 2,
                            type: 'classeCusto',
                            expandable: false,
                            data: { ccId: cc.id, classeId, filialId: filial.id, cc, classe },
                        }));
                    }
                }
            }
        }

        this.container.innerHTML = '';
        this.container.appendChild(tree);
    }

    createItem({ id, nome, badge, level, type, expandable, expanded, data }) {
        const item = document.createElement('div');
        item.className = `tree-item level-${level}`;
        item.dataset.id = id;
        item.dataset.type = type;
        if (this.selected === id) item.classList.add('selected');

        if (expandable) {
            const toggle = document.createElement('span');
            toggle.className = `tree-toggle ${expanded ? 'expanded' : ''}`;
            toggle.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 2.5L8 6L4.5 9.5"/></svg>`;
            toggle.addEventListener('click', (e) => { e.stopPropagation(); this.toggle(id); });
            item.appendChild(toggle);
        } else {
            const spacer = document.createElement('span');
            spacer.style.width = '16px';
            item.appendChild(spacer);
        }

        const icon = document.createElement('span');
        icon.className = 'tree-icon';
        icon.innerHTML = this.iconFor(type);
        item.appendChild(icon);

        const label = document.createElement('span');
        label.className = 'tree-label';
        label.textContent = nome;
        item.appendChild(label);

        if (badge) {
            const b = document.createElement('span');
            b.className = 'tree-badge';
            b.textContent = badge;
            item.appendChild(b);
        }

        item.addEventListener('click', () => this.select(id, type, data));
        return item;
    }

    iconFor(type) {
        const icons = {
            filial: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a2 2 0 012-2h4a2 2 0 012 2v9"/></svg>`,
            centroCusto: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
            classeCusto: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M6 12h12M9 18h6"/></svg>`,
        };
        return icons[type] || '';
    }

    toggle(id) {
        if (this.expanded.has(id)) this.expanded.delete(id); else this.expanded.add(id);
        this.render();
    }

    select(id, type, data) {
        this.selected = id;
        this.render();
        if (this.onSelectCallback) this.onSelectCallback({ id, type, data });
    }

    onSelect(cb) { this.onSelectCallback = cb; }

    expandAll() {
        if (this.data.filial) {
            this.expanded.add(this.data.filial.id);
            Object.keys(this.data.centrosCusto).forEach((id) => this.expanded.add(id));
        }
        this.render();
    }
}

let treeComponent;
function initTree() {
    treeComponent = new TreeComponent('tree-container');
    window.treeComponent = treeComponent;
    return treeComponent;
}

window.initTree = initTree;
export { TreeComponent, initTree };
