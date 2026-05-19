// Budgeter - Budget Editor (v2)
// Tabela achatada estilo planilha: uma linha por despesa, com colunas
// CC | Classe | Descrição | Responsáveis | Obs | Jan..Dez | Total
//
// Salva no caminho budgets/{ano}/{filialId}/{ccId}/{classeId}/{despesaId}.
// Suporta filtro por CC e Classe a partir do tree.

import db, { MESES, somaMeses } from './database.js';

class BudgetEditor {
    constructor() {
        this.state = {
            ano: new Date().getFullYear(),
            filialId: null,
            filtroCcId: null,
            filtroClasseId: null,
            linhas: [],
            ccs: {},
            classes: {},
            isDirty: new Set(),
        };
        this._unsub = null;
        this._debounceTimers = new Map();
    }

    init() {
        document.getElementById('btn-add-linha')?.addEventListener('click', () => this.addLinha());
        document.getElementById('btn-save')?.addEventListener('click', () => this.flushAll());

        document.getElementById('budget-tbody')?.addEventListener('input', (e) => this.onInput(e));

        window.addEventListener('tree:select', (e) => this.onTreeSelect(e.detail));
        window.addEventListener('app:filial-change', (e) => this.onFilialChange(e.detail.filialId));
        window.addEventListener('app:ano-change', (e) => this.onAnoChange(e.detail.ano));
    }

    async onFilialChange(filialId) {
        this.state.filialId = filialId;
        this.state.filtroCcId = null;
        this.state.filtroClasseId = null;
        await this.reload();
    }

    async onAnoChange(ano) {
        this.state.ano = Number(ano) || new Date().getFullYear();
        await this.reload();
    }

    async onTreeSelect({ type, id, data }) {
        if (type === 'filial') {
            this.state.filtroCcId = null;
            this.state.filtroClasseId = null;
        } else if (type === 'centroCusto') {
            this.state.filtroCcId = id;
            this.state.filtroClasseId = null;
        } else if (type === 'classeCusto') {
            this.state.filtroCcId = data?.ccId || null;
            this.state.filtroClasseId = data?.classeId || null;
        }
        this.render();
    }

    async reload() {
        if (this._unsub) { this._unsub(); this._unsub = null; }
        if (!this.state.filialId) {
            this.state.linhas = [];
            this.render();
            return;
        }

        this.state.ccs = await db.getCentrosCustoFilial(this.state.filialId);
        this.state.classes = await db.getClassesCusto();
        this.state.linhas = await db.getBudgetLinhas(this.state.ano, this.state.filialId);

        // Realtime
        this._unsub = db.onBudgetFilialChange(this.state.ano, this.state.filialId, (tree) => {
            if (this.state.isDirty.size > 0) return; // não atropela edição
            const linhas = [];
            for (const [ccId, classes] of Object.entries(tree || {})) {
                for (const [classeId, despesas] of Object.entries(classes)) {
                    for (const [id, d] of Object.entries(despesas)) {
                        linhas.push({ ...d, id, ccId, classeId, filialId: this.state.filialId, ano: this.state.ano });
                    }
                }
            }
            this.state.linhas = linhas;
            this.render();
        });

        this.render();
    }

    filtered() {
        return this.state.linhas.filter((l) => {
            if (this.state.filtroCcId && l.ccId !== this.state.filtroCcId) return false;
            if (this.state.filtroClasseId && l.classeId !== this.state.filtroClasseId) return false;
            return true;
        });
    }

    render() {
        const tbody = document.getElementById('budget-tbody');
        if (!tbody) return;

        const linhas = this.filtered();
        document.getElementById('editor-title').textContent = this.titulo();

        if (linhas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="20" class="empty-state">
                <p>Nenhuma linha encontrada para os filtros atuais.</p>
                <button class="btn btn-secondary btn-sm" onclick="window.budgetEditor.addLinha()">Adicionar nova linha</button>
            </td></tr>`;
            this.updateTotais([]);
            return;
        }

        tbody.innerHTML = '';
        for (const linha of linhas) {
            tbody.appendChild(this.row(linha));
        }
        this.updateTotais(linhas);
    }

    titulo() {
        if (this.state.filtroClasseId) {
            const c = this.state.classes[this.state.filtroClasseId];
            return c ? `${c.codigo} · ${c.descricao}` : 'Classe';
        }
        if (this.state.filtroCcId) {
            const cc = this.state.ccs[this.state.filtroCcId];
            return cc ? `${cc.codigo} · ${cc.nome}` : 'Centro de Custo';
        }
        return `Budget ${this.state.ano}`;
    }

    row(linha) {
        const tr = document.createElement('tr');
        tr.dataset.id = linha.id;
        tr.dataset.ccId = linha.ccId;
        tr.dataset.classeId = linha.classeId;
        const fmt = window.formatters;

        const cc = this.state.ccs[linha.ccId];
        const cl = this.state.classes[linha.classeId];

        const ccOptions = Object.values(this.state.ccs)
            .map((c) => `<option value="${c.id}" ${c.id === linha.ccId ? 'selected' : ''}>${escapeHtml(c.codigo + ' · ' + c.nome)}</option>`)
            .join('');
        const classeOptions = Object.values(this.state.classes)
            .map((c) => `<option value="${c.id}" ${c.id === linha.classeId ? 'selected' : ''}>${escapeHtml(c.codigo + ' · ' + c.descricao)}</option>`)
            .join('');

        const monthInputs = MESES.map((m) => `
            <td class="col-mes">
                <input type="text" data-field="${m}" value="${formatInput(linha[m])}" placeholder="0,00">
            </td>`).join('');

        tr.innerHTML = `
            <td class="col-cc"><select data-field="ccId">${ccOptions}</select></td>
            <td class="col-classe"><select data-field="classeId">${classeOptions}</select></td>
            <td class="col-desc"><input type="text" data-field="descricao" value="${escapeAttr(linha.descricao || '')}" placeholder="Descrição"></td>
            <td class="col-resp"><input type="text" data-field="responsaveis" value="${escapeAttr(linha.responsaveis || '')}" placeholder="Responsáveis"></td>
            <td class="col-obs"><input type="text" data-field="observacoes" value="${escapeAttr(linha.observacoes || '')}" placeholder="Observações"></td>
            ${monthInputs}
            <td class="col-total">${fmt.currency(linha.total || somaMeses(linha))}</td>
            <td class="col-acoes">
                <button class="btn-delete" data-action="delete" title="Remover linha">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4l1.5 12h5L14 4M4 4h12"/></svg>
                </button>
            </td>
        `;

        tr.querySelector('[data-action="delete"]').addEventListener('click', () => this.deleteLinha(linha));
        return tr;
    }

    onInput(e) {
        const input = e.target;
        const field = input.dataset.field;
        if (!field) return;
        const row = input.closest('tr');
        const id = row.dataset.id;
        this.state.isDirty.add(id);

        clearTimeout(this._debounceTimers.get(id));
        this._debounceTimers.set(id, setTimeout(() => this.flushRow(row), 600));
    }

    async flushRow(row) {
        const id = row.dataset.id;
        const linha = this.state.linhas.find((l) => l.id === id);
        if (!linha) return;

        const get = (f) => row.querySelector(`[data-field="${f}"]`)?.value || '';
        const newCcId = get('ccId') || linha.ccId;
        const newClasseId = get('classeId') || linha.classeId;
        const newData = {
            ...linha,
            id,
            ano: this.state.ano,
            filialId: this.state.filialId,
            descricao: get('descricao'),
            responsaveis: get('responsaveis'),
            observacoes: get('observacoes'),
        };
        for (const m of MESES) {
            newData[m] = window.formatters.parseCurrency(get(m));
        }
        newData.ccId = newCcId;
        newData.classeId = newClasseId;
        newData.total = somaMeses(newData);

        try {
            // Se mudou CC ou classe, precisa remover do path antigo
            if (newCcId !== linha.ccId || newClasseId !== linha.classeId) {
                await db.deleteBudgetLinha(this.state.ano, this.state.filialId, linha.ccId, linha.classeId, id);
            }
            await db.saveBudgetLinha(newData);
            Object.assign(linha, newData);
            row.querySelector('.col-total').textContent = window.formatters.currency(newData.total);
            this.updateTotais(this.filtered());
            this.toast('Salvo', 'success');
        } catch (err) {
            console.error(err);
            this.toast('Erro ao salvar', 'error');
        } finally {
            this.state.isDirty.delete(id);
        }
    }

    async flushAll() {
        const rows = document.querySelectorAll('#budget-tbody tr[data-id]');
        for (const row of rows) await this.flushRow(row);
        this.toast('Todas alterações salvas', 'success');
    }

    async addLinha() {
        if (!this.state.filialId) {
            this.toast('Selecione uma filial primeiro', 'warning');
            return;
        }
        const ccIds = Object.keys(this.state.ccs);
        const classeIds = Object.keys(this.state.classes);
        if (!ccIds.length || !classeIds.length) {
            this.toast('Cadastre Centros de Custo e Classes antes (Admin)', 'warning');
            return;
        }

        const nova = {
            id: 'despesa_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            ano: this.state.ano,
            filialId: this.state.filialId,
            ccId: this.state.filtroCcId || ccIds[0],
            classeId: this.state.filtroClasseId || classeIds[0],
            descricao: '',
            responsaveis: '',
            observacoes: '',
            total: 0,
            createdAt: Date.now(),
        };
        MESES.forEach((m) => (nova[m] = 0));

        await db.saveBudgetLinha(nova);
        this.state.linhas.push(nova);
        this.render();
    }

    async deleteLinha(linha) {
        if (!confirm(`Remover linha "${linha.descricao || linha.id}"?`)) return;
        try {
            await db.deleteBudgetLinha(this.state.ano, this.state.filialId, linha.ccId, linha.classeId, linha.id);
            this.state.linhas = this.state.linhas.filter((l) => l.id !== linha.id);
            this.render();
            this.toast('Linha removida', 'success');
        } catch (err) {
            console.error(err);
            this.toast('Erro ao remover', 'error');
        }
    }

    updateTotais(linhas) {
        const fmt = window.formatters;
        const totais = Object.fromEntries(MESES.map((m) => [m, 0]));
        let total = 0;
        for (const l of linhas) {
            for (const m of MESES) totais[m] += Number(l[m]) || 0;
            total += Number(l.total) || 0;
        }
        for (const m of MESES) {
            const el = document.getElementById(`total-${m}`);
            if (el) el.textContent = fmt.currency(totais[m]);
        }
        const tg = document.getElementById('total-geral');
        if (tg) tg.textContent = fmt.currency(total);

        // Metric cards
        const orcado = total;
        const media = total / 12;
        document.getElementById('metric-total-orcado').textContent = fmt.currency(orcado);
        document.getElementById('metric-total-realizado').textContent = fmt.currency(0);
        document.getElementById('metric-saldo').textContent = fmt.currency(orcado);
        document.getElementById('metric-media').textContent = fmt.currency(media);
    }

    toast(msg, type) {
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: msg, type } }));
    }
}

function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function escapeAttr(s) { return escapeHtml(s).replace(/'/g, '&#39;'); }
function formatInput(v) {
    if (!v || v === 0) return '';
    return window.formatters.number(v, 2);
}

let budgetEditor;
function initBudgetEditor() {
    budgetEditor = new BudgetEditor();
    budgetEditor.init();
    window.budgetEditor = budgetEditor;
    return budgetEditor;
}
window.initBudgetEditor = initBudgetEditor;

export { BudgetEditor, initBudgetEditor };
