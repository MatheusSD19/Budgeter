// Budgeter - Budget Editor
// Lógica do editor de budget com cálculos em tempo real

class BudgetEditor {
    constructor() {
        this.db = window.db;
        this.formatters = window.formatters;
        
        this.state = {
            ano: new Date().getFullYear(),
            unidadeId: null,
            setorId: null,
            ccId: null,
            linhas: {},
            totalCC: {},
            isDirty: false
        };

        this.debounceTimer = null;
        
        this.init();
    }

    init() {
        // Botão adicionar linha
        const btnAdd = document.getElementById('btn-add-linha');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => this.addLinha());
        }

        // Botão salvar
        const btnSave = document.getElementById('btn-save');
        if (btnSave) {
            btnSave.addEventListener('click', () => this.saveAll());
        }

        // Evento de mudança nos inputs (delegation)
        const tbody = document.getElementById('budget-tbody');
        if (tbody) {
            tbody.addEventListener('input', (e) => this.handleInput(e));
            tbody.addEventListener('change', (e) => this.handleChange(e));
        }

        // Listener de dados em tempo real
        window.addEventListener('tree:select', (e) => this.onTreeSelect(e.detail));
    }

    async onTreeSelect({ id, type, data }) {
        if (type !== 'centroCusto') {
            this.clearEditor();
            return;
        }

        // Atualiza estado
        this.state.ccId = id;
        this.state.setorId = data.setorId;
        this.state.unidadeId = data.unidadeId;
        this.state.isDirty = false;

        // Atualiza título
        document.getElementById('editor-title').textContent = data.nome;

        // Atualiza breadcrumbs
        const unidade = await this.db.getUnidade(this.state.unidadeId);
        const setor = await this.db.getSetor(this.state.unidadeId, this.state.setorId);
        
        document.getElementById('breadcrumb-unidade').textContent = unidade?.nome || 'Unidade';
        document.getElementById('breadcrumb-setor').textContent = setor?.nome || 'Setor';
        document.getElementById('breadcrumb-cc').textContent = data.nome;

        // Carrega dados
        await this.loadBudget();
        
        // Setup listener em tempo real
        this.setupRealtimeListener();
    }

    async loadBudget() {
        const { ano, unidadeId, setorId, ccId } = this.state;
        
        const { linhas, totalCC } = await this.db.getBudgetComTotais(ano, unidadeId, setorId, ccId);
        
        this.state.linhas = linhas;
        this.state.totalCC = totalCC;
        
        this.render();
        this.updateMetricCards();
    }

    setupRealtimeListener() {
        const { ano, unidadeId, setorId, ccId } = this.state;
        
        // Remove listener anterior
        if (this.currentListener) {
            this.db.offBudgetChange(ano, unidadeId, setorId, ccId);
        }

        // Configura novo listener
        this.currentListener = this.db.onBudgetChange(ano, unidadeId, setorId, ccId, (data) => {
            // Só atualiza se não estiver editando
            if (!this.state.isDirty) {
                this.state.linhas = data;
                this.render();
                this.updateMetricCards();
            }
        });
    }

    render() {
        const tbody = document.getElementById('budget-tbody');
        tbody.innerHTML = '';

        const linhasArray = Object.values(this.state.linhas)
            .filter(l => l.id !== 'cc_total')
            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

        if (linhasArray.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="15" class="empty-state">
                        <p>Nenhuma linha de budget cadastrada</p>
                        <button class="btn btn-secondary btn-sm" onclick="window.budgetEditor.addLinha()">
                            Adicionar primeira linha
                        </button>
                    </td>
                </tr>
            `;
        } else {
            linhasArray.forEach(linha => {
                const tr = this.createLinhaRow(linha);
                tbody.appendChild(tr);
            });
        }

        this.updateTotais();
    }

    createLinhaRow(linha) {
        const tr = document.createElement('tr');
        tr.dataset.id = linha.id;

        const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

        tr.innerHTML = `
            <td class="col-descricao">
                <input type="text" 
                       data-field="descricao" 
                       value="${linha.descricao || ''}" 
                       placeholder="Descrição da despesa">
            </td>
            ${meses.map(mes => `
                <td class="col-mes">
                    <input type="text" 
                           data-field="${mes}" 
                           value="${this.formatInputValue(linha[mes])}" 
                           placeholder="0,00">
                </td>
            `).join('')}
            <td class="col-total">${this.formatters.currency(linha.total || 0)}</td>
            <td class="col-acoes">
                <button class="btn-delete" data-action="delete" title="Remover linha">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 4l1.5 12h5L14 4M4 4h12"/>
                    </svg>
                </button>
            </td>
        `;

        // Handler para delete
        tr.querySelector('[data-action="delete"]').addEventListener('click', () => {
            this.deleteLinha(linha.id);
        });

        return tr;
    }

    formatInputValue(value) {
        if (!value || value === 0) return '';
        return this.formatters.number(value, 2);
    }

    handleInput(e) {
        const input = e.target;
        if (!input.dataset.field) return;

        this.state.isDirty = true;

        // Debounce para salvar
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.saveLinha(input.closest('tr').dataset.id);
        }, 500);
    }

    handleChange(e) {
        const input = e.target;
        if (!input.dataset.field) return;

        // Formata valor monetário
        if (input.dataset.field !== 'descricao') {
            const value = this.formatters.parseCurrency(input.value);
            input.value = value > 0 ? this.formatters.number(value, 2) : '';
        }

        this.saveLinha(input.closest('tr').dataset.id);
    }

    async saveLinha(linhaId) {
        const row = document.querySelector(`tr[data-id="${linhaId}"]`);
        if (!row) return;

        const data = {
            id: linhaId,
            ano: this.state.ano,
            unidadeId: this.state.unidadeId,
            setorId: this.state.setorId,
            ccId: this.state.ccId,
            descricao: row.querySelector('[data-field="descricao"]').value,
            createdAt: this.state.linhas[linhaId]?.createdAt || Date.now(),
            updatedAt: Date.now()
        };

        const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        let total = 0;

        meses.forEach(mes => {
            const value = this.formatters.parseCurrency(
                row.querySelector(`[data-field="${mes}"]`).value
            );
            data[mes] = value;
            total += value;
        });

        data.total = total;

        // Atualiza UI local
        this.state.linhas[linhaId] = data;
        row.querySelector('.col-total').textContent = this.formatters.currency(total);
        
        this.updateTotais();
        this.updateMetricCards();

        // Salva no Firebase
        try {
            await this.db.saveLinhaBudget(
                this.state.ano,
                this.state.unidadeId,
                this.state.setorId,
                this.state.ccId,
                linhaId,
                data
            );
            
            this.state.isDirty = false;
            this.showToast('Salvo automaticamente', 'success');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            this.showToast('Erro ao salvar', 'error');
        }
    }

    async deleteLinha(linhaId) {
        if (!confirm('Tem certeza que deseja remover esta linha?')) return;

        try {
            await this.db.deleteLinhaBudget(
                this.state.ano,
                this.state.unidadeId,
                this.state.setorId,
                this.state.ccId,
                linhaId
            );

            delete this.state.linhas[linhaId];
            this.render();
            this.showToast('Linha removida', 'success');
        } catch (error) {
            console.error('Erro ao deletar:', error);
            this.showToast('Erro ao remover linha', 'error');
        }
    }

    addLinha() {
        if (!this.state.ccId) {
            this.showToast('Selecione um centro de custo primeiro', 'warning');
            return;
        }

        const id = 'linha_' + Date.now();
        const novaLinha = {
            id,
            descricao: 'Nova despesa',
            jan: 0, fev: 0, mar: 0, abr: 0, mai: 0, jun: 0,
            jul: 0, ago: 0, set: 0, out: 0, nov: 0, dez: 0,
            total: 0,
            createdAt: Date.now()
        };

        this.state.linhas[id] = novaLinha;
        
        const tbody = document.getElementById('budget-tbody');
        
        // Remove empty state se existir
        const emptyState = tbody.querySelector('.empty-state');
        if (emptyState) {
            emptyState.closest('tr').remove();
        }

        const tr = this.createLinhaRow(novaLinha);
        tbody.appendChild(tr);
        
        // Focus no campo de descrição
        tr.querySelector('[data-field="descricao"]').focus();
        tr.querySelector('[data-field="descricao"]').select();

        this.saveLinha(id);
    }

    async saveAll() {
        const promises = Object.keys(this.state.linhas).map(id => this.saveLinha(id));
        await Promise.all(promises);
        this.showToast('Todas as alterações salvas', 'success');
    }

    updateTotais() {
        const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        const totais = {};
        let totalGeral = 0;

        // Calcula totais por mês
        meses.forEach(mes => {
            let totalMes = 0;
            Object.values(this.state.linhas).forEach(linha => {
                totalMes += linha[mes] || 0;
            });
            totais[mes] = totalMes;
            totalGeral += totalMes;
        });

        // Atualiza DOM
        meses.forEach(mes => {
            const el = document.getElementById(`total-${mes}`);
            if (el) {
                el.textContent = this.formatters.currency(totais[mes]);
            }
        });

        const elTotal = document.getElementById('total-geral');
        if (elTotal) {
            elTotal.textContent = this.formatters.currency(totalGeral);
        }

        // Salva totais do CC
        this.state.totalCC = { ...totais, total: totalGeral };
    }

    updateMetricCards() {
        const totalOrcado = this.state.totalCC.total || 0;
        const totalRealizado = 0; // TODO: Implementar quando tiver dados reais
        const saldo = totalOrcado - totalRealizado;
        const media = totalOrcado / 12;

        document.getElementById('metric-total-orcado').textContent = this.formatters.currency(totalOrcado);
        document.getElementById('metric-total-realizado').textContent = this.formatters.currency(totalRealizado);
        document.getElementById('metric-saldo').textContent = this.formatters.currency(saldo);
        document.getElementById('metric-media').textContent = this.formatters.currency(media);

        // Atualiza badges de status
        const saldoBadge = document.getElementById('metric-saldo-badge');
        if (saldo >= 0) {
            saldoBadge.innerHTML = '<span class="badge badge-positive">Dentro do orçamento</span>';
        } else {
            saldoBadge.innerHTML = '<span class="badge badge-negative">Orçamento estourado</span>';
        }

        const realizadoPercent = totalOrcado > 0 ? Math.round((totalRealizado / totalOrcado) * 100) : 0;
        document.getElementById('metric-realizado-percent').textContent = `${realizadoPercent}%`;
    }

    clearEditor() {
        this.state.ccId = null;
        this.state.setorId = null;
        this.state.linhas = {};
        this.state.totalCC = {};
        
        document.getElementById('editor-title').textContent = 'Selecione um Centro de Custo';
        document.getElementById('budget-tbody').innerHTML = `
            <tr>
                <td colspan="15" class="empty-state">
                    <p>Selecione um centro de custo na navegação</p>
                </td>
            </tr>
        `;
        
        // Limpa totais
        const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        meses.forEach(mes => {
            const el = document.getElementById(`total-${mes}`);
            if (el) el.textContent = 'R$ 0,00';
        });
        document.getElementById('total-geral').textContent = 'R$ 0,00';

        // Remove listener
        if (this.currentListener) {
            const { ano, unidadeId, setorId, ccId } = this.state;
            this.db.offBudgetChange(ano, unidadeId, setorId, ccId);
            this.currentListener = null;
        }
    }

    showToast(message, type) {
        window.dispatchEvent(new CustomEvent('app:toast', {
            detail: { message, type }
        }));
    }
}

// Singleton
let budgetEditor;
function initBudgetEditor() {
    budgetEditor = new BudgetEditor();
    window.budgetEditor = budgetEditor;
    return budgetEditor;
}

window.initBudgetEditor = initBudgetEditor;

export { BudgetEditor, initBudgetEditor };
