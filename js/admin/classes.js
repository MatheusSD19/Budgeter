// Admin: Classes de Custo (catálogo global)

import { toast, openModal, closeModal, renderTab } from './admin.js';
import { escapeHtml, escapeAttr } from './utils.js';

export async function renderClassesTab(root, { db }) {
    const classes = await db.getClassesCusto(true);
    const list = Object.values(classes).sort((a, b) => (a.codigo || '').localeCompare(b.codigo || ''));

    root.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'admin-card';
    card.innerHTML = `
        <div class="admin-card-header">
            <div>
                <h2>Classes de Custo</h2>
                <p class="muted small">Catálogo global usado por todas as filiais.</p>
            </div>
            <div>
                <input id="cl-search" class="select-dark" placeholder="Buscar por código ou descrição..." style="min-width:280px">
                <button class="btn btn-primary btn-sm" id="btn-new">+ Nova classe</button>
            </div>
        </div>
        <table class="admin-table">
            <thead><tr><th>Código</th><th>Descrição</th><th>Grupo Geral</th><th>Sub-Grupo</th><th></th></tr></thead>
            <tbody id="cl-tbody">${rows(list)}</tbody>
        </table>
    `;
    root.appendChild(card);

    const tbody = card.querySelector('#cl-tbody');
    const filterInput = card.querySelector('#cl-search');
    filterInput.addEventListener('input', () => {
        const term = filterInput.value.toLowerCase();
        const filtered = list.filter((c) =>
            (c.codigo || '').toLowerCase().includes(term) ||
            (c.descricao || '').toLowerCase().includes(term) ||
            (c.grupoGeral || '').toLowerCase().includes(term) ||
            (c.subGrupo || '').toLowerCase().includes(term)
        );
        tbody.innerHTML = rows(filtered);
        bindRows();
    });

    const bindRows = () => {
        tbody.querySelectorAll('tr[data-id]').forEach((tr) => {
            const id = tr.dataset.id;
            tr.querySelector('[data-action="edit"]').addEventListener('click', () => abrirForm(classes[id]));
            tr.querySelector('[data-action="del"]').addEventListener('click', async () => {
                if (!confirm(`Excluir classe ${classes[id].codigo}?`)) return;
                await db.deleteClasseCusto(id); toast('Excluído', 'success'); renderTab();
            });
        });
    };
    bindRows();
    card.querySelector('#btn-new').addEventListener('click', () => abrirForm({}));
}

function rows(list) {
    return list.map((c) => `
        <tr data-id="${c.id}">
            <td><code>${escapeHtml(c.codigo || '')}</code></td>
            <td>${escapeHtml(c.descricao || '')}</td>
            <td>${escapeHtml(c.grupoGeral || '')}</td>
            <td>${escapeHtml(c.subGrupo || '')}</td>
            <td>
                <button class="btn btn-ghost btn-sm" data-action="edit">Editar</button>
                <button class="btn btn-ghost btn-sm" data-action="del">Excluir</button>
            </td>
        </tr>`).join('');
}

function abrirForm(classe) {
    const content = document.createElement('div');
    content.className = 'modal-content';
    content.innerHTML = `
        <div class="modal-header"><h3>${classe.id ? 'Editar' : 'Nova'} classe</h3><button class="btn btn-ghost btn-icon" onclick="closeModal()">✕</button></div>
        <div class="modal-body">
            <div class="grid-2">
                <div class="input-group"><label>Código</label><input id="f-codigo" value="${escapeAttr(classe.codigo || '')}"></div>
                <div class="input-group"><label>Descrição</label><input id="f-desc" value="${escapeAttr(classe.descricao || '')}"></div>
            </div>
            <div class="grid-2">
                <div class="input-group"><label>Grupo Geral</label><input id="f-grupo" value="${escapeAttr(classe.grupoGeral || '')}"></div>
                <div class="input-group"><label>Sub-Grupo</label><input id="f-sub" value="${escapeAttr(classe.subGrupo || '')}"></div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" id="btn-save">Salvar</button>
        </div>`;
    openModal(content);
    content.querySelector('#btn-save').addEventListener('click', async () => {
        await window.db.saveClasseCusto({
            ...classe,
            codigo: content.querySelector('#f-codigo').value.trim(),
            descricao: content.querySelector('#f-desc').value.trim(),
            grupoGeral: content.querySelector('#f-grupo').value.trim(),
            subGrupo: content.querySelector('#f-sub').value.trim(),
        });
        toast('Classe salva', 'success'); closeModal(); renderTab();
    });
}
