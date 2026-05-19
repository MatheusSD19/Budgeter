// Admin: Centros de Custo

import { toast, openModal, closeModal, renderTab } from './admin.js';
import { escapeHtml, escapeAttr } from './utils.js';

export async function renderCcsTab(root, { db }) {
    const filiais = await db.getFiliais(true);
    const filiaisList = Object.values(filiais).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

    if (filiaisList.length === 0) {
        root.innerHTML = '<div class="empty-state"><h3>Sem filiais</h3><p>Cadastre uma filial primeiro.</p></div>';
        return;
    }

    root.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'admin-card';
    card.innerHTML = `
        <div class="admin-card-header">
            <div>
                <h2>Centros de Custo</h2>
                <p class="muted small">CCs por filial.</p>
            </div>
            <div>
                <select id="filial-filter" class="select-dark">
                    ${filiaisList.map((f) => `<option value="${f.id}">${escapeHtml(f.codigo || '')} · ${escapeHtml(f.nome)}</option>`).join('')}
                </select>
                <button class="btn btn-primary btn-sm" id="btn-new">+ Novo CC</button>
            </div>
        </div>
        <div id="ccs-list"></div>
    `;
    root.appendChild(card);

    const renderList = async () => {
        const filialId = card.querySelector('#filial-filter').value;
        const ccs = await db.getCentrosCustoFilial(filialId, true);
        const list = Object.values(ccs).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        const target = card.querySelector('#ccs-list');
        target.innerHTML = `
            <table class="admin-table">
                <thead><tr><th>Código</th><th>Nome</th><th>Budget (categoria)</th><th>Ativo</th><th></th></tr></thead>
                <tbody>
                    ${list.map((cc) => `
                        <tr data-id="${cc.id}">
                            <td><code>${escapeHtml(cc.codigo || '')}</code></td>
                            <td>${escapeHtml(cc.nome)}</td>
                            <td>${escapeHtml(cc.budget || '')}</td>
                            <td>${cc.ativo === false ? '<span class="badge badge-negative">Não</span>' : '<span class="badge badge-positive">Sim</span>'}</td>
                            <td>
                                <button class="btn btn-ghost btn-sm" data-action="edit">Editar</button>
                                <button class="btn btn-ghost btn-sm" data-action="del">Excluir</button>
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table>`;
        target.querySelectorAll('tr[data-id]').forEach((tr) => {
            const id = tr.dataset.id;
            tr.querySelector('[data-action="edit"]').addEventListener('click', () => abrirForm(filialId, ccs[id]));
            tr.querySelector('[data-action="del"]').addEventListener('click', async () => {
                if (!confirm(`Excluir CC "${ccs[id].nome}"?`)) return;
                await db.deleteCentroCusto(filialId, id); toast('Excluído', 'success'); renderList();
            });
        });
    };

    card.querySelector('#filial-filter').addEventListener('change', renderList);
    card.querySelector('#btn-new').addEventListener('click', () => abrirForm(card.querySelector('#filial-filter').value, {}));
    await renderList();
}

function abrirForm(filialId, cc) {
    const content = document.createElement('div');
    content.className = 'modal-content';
    content.innerHTML = `
        <div class="modal-header"><h3>${cc.id ? 'Editar' : 'Novo'} CC</h3><button class="btn btn-ghost btn-icon" onclick="closeModal()">✕</button></div>
        <div class="modal-body">
            <div class="grid-2">
                <div class="input-group"><label>Código</label><input id="f-codigo" value="${escapeAttr(cc.codigo || '')}"></div>
                <div class="input-group"><label>Nome</label><input id="f-nome" value="${escapeAttr(cc.nome || '')}"></div>
            </div>
            <div class="grid-2">
                <div class="input-group"><label>Budget (categoria livre)</label><input id="f-budget" value="${escapeAttr(cc.budget || '')}"></div>
                <div class="input-group"><label>Ordem</label><input id="f-ordem" type="number" value="${cc.ordem || 0}"></div>
            </div>
            <div class="input-group">
                <label><input type="checkbox" id="f-ativo" ${cc.ativo === false ? '' : 'checked'}> Ativo</label>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" id="btn-save">Salvar</button>
        </div>`;
    openModal(content);
    content.querySelector('#btn-save').addEventListener('click', async () => {
        await window.db.saveCentroCusto({
            ...cc,
            filialId,
            codigo: content.querySelector('#f-codigo').value.trim(),
            nome: content.querySelector('#f-nome').value.trim(),
            budget: content.querySelector('#f-budget').value.trim(),
            ordem: Number(content.querySelector('#f-ordem').value) || 0,
            ativo: content.querySelector('#f-ativo').checked,
        });
        toast('CC salvo', 'success'); closeModal(); renderTab();
    });
}
