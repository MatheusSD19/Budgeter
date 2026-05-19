// Admin: Histórico de Landings (lista versões por ano, permite ver detalhes e remover)

import { toast, openModal, closeModal, renderTab } from './admin.js';
import { escapeHtml } from './utils.js';
import { MESES, somaMeses } from '../database.js';

export async function renderLandingHistoricoTab(root, { db }) {
    const anos = await listarAnos();
    if (!anos.length) {
        root.innerHTML = '<div class="empty-state"><h3>Sem históricos</h3><p>Importe um Landing primeiro.</p></div>';
        return;
    }

    root.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'admin-card';
    card.innerHTML = `
        <div class="admin-card-header">
            <div>
                <h2>Histórico de Landings</h2>
                <p class="muted small">Selecione um ano para listar versões salvas.</p>
            </div>
            <div>
                <select id="hl-ano" class="select-dark">
                    ${anos.map((a) => `<option value="${a}">${a}</option>`).join('')}
                </select>
            </div>
        </div>
        <div id="hl-list"></div>
    `;
    root.appendChild(card);

    const renderList = async () => {
        const ano = card.querySelector('#hl-ano').value;
        const versoes = await db.getLandingsAno(ano);
        const list = Object.values(versoes).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        const target = card.querySelector('#hl-list');
        if (!list.length) { target.innerHTML = '<p class="muted">Nenhuma versão.</p>'; return; }
        target.innerHTML = `
            <table class="admin-table">
                <thead><tr><th>Versão</th><th>Nome</th><th>Linhas</th><th>Total Ano</th><th>Criado por</th><th>Data</th><th></th></tr></thead>
                <tbody>
                    ${list.map((v) => `
                        <tr data-id="${v.id}">
                            <td><code>${escapeHtml(v.id)}</code></td>
                            <td>${escapeHtml(v.nome || '')}</td>
                            <td>${v.totalLinhas || Object.keys(v.linhas || {}).length}</td>
                            <td>${window.formatters.currency(Object.values(v.linhas || {}).reduce((s, l) => s + somaMeses(l), 0))}</td>
                            <td>${escapeHtml(v.createdBy || '—')}</td>
                            <td>${window.formatters.datetime(v.createdAt)}</td>
                            <td>
                                <button class="btn btn-ghost btn-sm" data-action="view">Ver</button>
                                <button class="btn btn-ghost btn-sm" data-action="apply">Aplicar como Budget</button>
                                <button class="btn btn-ghost btn-sm" data-action="del">Excluir</button>
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table>
        `;
        target.querySelectorAll('tr[data-id]').forEach((tr) => {
            const id = tr.dataset.id;
            const v = list.find((x) => x.id === id);
            tr.querySelector('[data-action="view"]').addEventListener('click', () => abrirDetalhe(ano, v));
            tr.querySelector('[data-action="apply"]').addEventListener('click', () => aplicarComoBudget(ano, v));
            tr.querySelector('[data-action="del"]').addEventListener('click', async () => {
                if (!confirm(`Excluir versão ${id}?`)) return;
                await db.deleteLandingVersion(ano, id); toast('Versão removida', 'success'); renderList();
            });
        });
    };

    card.querySelector('#hl-ano').addEventListener('change', renderList);
    await renderList();
}

async function listarAnos() {
    const fb = window.firebase;
    const snap = await fb.get(fb.ref(fb.db, 'landings'));
    if (!snap.exists()) return [];
    return Object.keys(snap.val()).sort().reverse();
}

function abrirDetalhe(ano, v) {
    const linhas = Object.values(v.linhas || {});
    const total = linhas.reduce((s, l) => s + somaMeses(l), 0);
    const content = document.createElement('div');
    content.className = 'modal-content modal-lg';
    content.innerHTML = `
        <div class="modal-header"><h3>Landing ${ano} · ${escapeHtml(v.nome || v.id)}</h3><button class="btn btn-ghost btn-icon" onclick="closeModal()">✕</button></div>
        <div class="modal-body">
            <p class="muted">Criado por ${escapeHtml(v.createdBy || '—')} em ${window.formatters.datetime(v.createdAt)}.</p>
            <p>Total anual: <strong>${window.formatters.currency(total)}</strong> · ${linhas.length} linha(s).</p>
            <div class="table-container">
                <table class="budget-table">
                    <thead><tr><th>Filial</th><th>CC</th><th>Classe</th><th>Descrição</th><th class="num">Total</th></tr></thead>
                    <tbody>
                        ${linhas.slice(0, 200).map((l) => `
                            <tr>
                                <td>${escapeHtml(l.filialId)}</td>
                                <td>${escapeHtml(l.ccId)}</td>
                                <td>${escapeHtml(l.classeId)}</td>
                                <td>${escapeHtml(l.descricao)}</td>
                                <td class="num">${window.formatters.currency(somaMeses(l))}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>
                ${linhas.length > 200 ? `<p class="muted small">+ ${linhas.length - 200} linhas não exibidas.</p>` : ''}
            </div>
        </div>
        <div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">Fechar</button></div>
    `;
    openModal(content);
}

async function aplicarComoBudget(anoLanding, v) {
    const anoDestino = prompt(`Aplicar esta versão como Budget de qual ano?`, String(anoLanding + 1));
    if (!anoDestino) return;
    if (!confirm(`Isto irá ADICIONAR/SOBRESCREVER as linhas no Budget ${anoDestino}. Continuar?`)) return;

    const fb = window.firebase;
    const updates = {};
    for (const l of Object.values(v.linhas || {})) {
        const path = `budgets/${anoDestino}/${l.filialId}/${l.ccId}/${l.classeId}/${l.id}`;
        updates[path] = { ...l, ano: Number(anoDestino), total: somaMeses(l), updatedAt: Date.now() };
    }
    await fb.update(fb.ref(fb.db), updates);
    toast(`Budget ${anoDestino} atualizado com ${Object.keys(v.linhas || {}).length} linhas`, 'success');
}
