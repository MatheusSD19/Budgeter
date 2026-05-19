// Admin: Filiais

import { toast, openModal, closeModal, renderTab } from './admin.js';
import { escapeHtml, escapeAttr } from './utils.js';

export async function renderFiliaisTab(root, { db }) {
    const filiais = await db.getFiliais(true);
    const list = Object.values(filiais).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

    root.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'admin-card';
    card.innerHTML = `
        <div class="admin-card-header">
            <div><h2>Filiais</h2><p class="muted small">Unidades operacionais cadastradas.</p></div>
            <button class="btn btn-primary btn-sm" id="btn-new">+ Nova filial</button>
        </div>
        <table class="admin-table">
            <thead><tr><th>Código</th><th>Nome</th><th>FIMMO/Externo</th><th>Ativo</th><th></th></tr></thead>
            <tbody>
                ${list.map((f) => `
                    <tr data-id="${f.id}">
                        <td><code>${escapeHtml(f.codigo || '')}</code></td>
                        <td>${escapeHtml(f.nome)}</td>
                        <td>${escapeHtml(f.fimmo || '')}</td>
                        <td>${f.ativo === false ? '<span class="badge badge-negative">Não</span>' : '<span class="badge badge-positive">Sim</span>'}</td>
                        <td>
                            <button class="btn btn-ghost btn-sm" data-action="edit">Editar</button>
                            <button class="btn btn-ghost btn-sm" data-action="del">Excluir</button>
                        </td>
                    </tr>`).join('')}
            </tbody>
        </table>
    `;
    root.appendChild(card);

    card.querySelectorAll('tr[data-id]').forEach((tr) => {
        const id = tr.dataset.id;
        tr.querySelector('[data-action="edit"]').addEventListener('click', () => abrirForm(filiais[id]));
        tr.querySelector('[data-action="del"]').addEventListener('click', async () => {
            if (!confirm(`Excluir filial "${filiais[id].nome}"? CCs vinculados não serão removidos automaticamente.`)) return;
            await db.deleteFilial(id); toast('Excluído', 'success'); renderTab();
        });
    });
    card.querySelector('#btn-new').addEventListener('click', () => abrirForm({}));
}

function abrirForm(filial) {
    const content = document.createElement('div');
    content.className = 'modal-content';
    content.innerHTML = `
        <div class="modal-header"><h3>${filial.id ? 'Editar' : 'Nova'} filial</h3><button class="btn btn-ghost btn-icon" onclick="closeModal()">✕</button></div>
        <div class="modal-body">
            <div class="grid-2">
                <div class="input-group"><label>Código</label><input id="f-codigo" value="${escapeAttr(filial.codigo || '')}"></div>
                <div class="input-group"><label>Nome</label><input id="f-nome" value="${escapeAttr(filial.nome || '')}"></div>
            </div>
            <div class="grid-2">
                <div class="input-group"><label>FIMMO / Código externo</label><input id="f-fimmo" value="${escapeAttr(filial.fimmo || '')}"></div>
                <div class="input-group"><label>Ordem</label><input id="f-ordem" type="number" value="${filial.ordem || 0}"></div>
            </div>
            <div class="input-group">
                <label><input type="checkbox" id="f-ativo" ${filial.ativo === false ? '' : 'checked'}> Ativo</label>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" id="btn-save">Salvar</button>
        </div>`;
    openModal(content);
    content.querySelector('#btn-save').addEventListener('click', async () => {
        await window.db.saveFilial({
            ...filial,
            codigo: content.querySelector('#f-codigo').value.trim(),
            nome: content.querySelector('#f-nome').value.trim(),
            fimmo: content.querySelector('#f-fimmo').value.trim(),
            ordem: Number(content.querySelector('#f-ordem').value) || 0,
            ativo: content.querySelector('#f-ativo').checked,
        });
        toast('Filial salva', 'success'); closeModal(); renderTab();
    });
}
