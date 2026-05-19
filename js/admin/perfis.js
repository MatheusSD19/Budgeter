// Admin: Perfis (templates de permissões)

import { toast, openModal, closeModal, renderTab } from './admin.js';
import { escapeHtml, escapeAttr } from './utils.js';

const PERMISSOES = [
    ['gerirUsuarios', 'Gerir usuários'],
    ['gerirEstrutura', 'Gerir estrutura (filiais, CCs, classes)'],
    ['importarLanding', 'Importar Landing (CSV/Excel)'],
    ['editarLanding', 'Editar Landing'],
    ['editarBudget', 'Editar Budget'],
    ['editarVolume', 'Editar Volume'],
    ['verRelatorios', 'Ver relatórios'],
];

export async function renderPerfisTab(root, { db }) {
    const perfis = await db.getPerfis(true);
    const list = Object.values(perfis).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

    root.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'admin-card';
    card.innerHTML = `
        <div class="admin-card-header">
            <div>
                <h2>Perfis & Permissões</h2>
                <p class="muted small">Templates que podem ser aplicados a usuários.</p>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-new-perfil">+ Novo perfil</button>
        </div>
        <table class="admin-table">
            <thead>
                <tr><th>Nome</th><th>Papel</th><th>Permissões ativas</th><th></th></tr>
            </thead>
            <tbody>
                ${list.map((p) => `
                    <tr data-id="${p.id}">
                        <td>${escapeHtml(p.nome)}<div class="muted small">${escapeHtml(p.descricao || '')}</div></td>
                        <td><span class="badge">${p.role || '—'}</span></td>
                        <td>${Object.entries(p.permissoes || {}).filter(([, v]) => v).map(([k]) => `<span class="chip">${k}</span>`).join(' ')}</td>
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
        tr.querySelector('[data-action="edit"]').addEventListener('click', () => abrirForm(perfis[id]));
        tr.querySelector('[data-action="del"]').addEventListener('click', async () => {
            if (!confirm(`Excluir perfil "${perfis[id].nome}"?`)) return;
            await db.deletePerfil(id); toast('Perfil excluído', 'success'); renderTab();
        });
    });

    card.querySelector('#btn-new-perfil').addEventListener('click', () => abrirForm({}));
}

function abrirForm(perfil) {
    const checks = PERMISSOES.map(([k, label]) => `
        <label class="check-pill">
            <input type="checkbox" data-perm="${k}" ${perfil.permissoes?.[k] ? 'checked' : ''}>
            <span>${label}</span>
        </label>`).join('');

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.innerHTML = `
        <div class="modal-header"><h3>${perfil.id ? 'Editar' : 'Novo'} perfil</h3><button class="btn btn-ghost btn-icon" onclick="closeModal()">✕</button></div>
        <div class="modal-body">
            <div class="input-group">
                <label>Nome</label>
                <input id="f-nome" value="${escapeAttr(perfil.nome || '')}">
            </div>
            <div class="input-group">
                <label>Descrição</label>
                <input id="f-desc" value="${escapeAttr(perfil.descricao || '')}">
            </div>
            <div class="input-group">
                <label>Papel padrão</label>
                <select id="f-role" class="select-dark">
                    <option value="admin"      ${perfil.role === 'admin' ? 'selected' : ''}>admin</option>
                    <option value="financeiro" ${perfil.role === 'financeiro' ? 'selected' : ''}>financeiro</option>
                    <option value="manager"    ${perfil.role === 'manager' ? 'selected' : ''}>manager</option>
                    <option value="viewer"     ${perfil.role === 'viewer' ? 'selected' : ''}>viewer</option>
                </select>
            </div>
            <div class="input-group">
                <label>Permissões</label>
                <div class="check-pills">${checks}</div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" id="btn-save">Salvar</button>
        </div>`;
    openModal(content);

    content.querySelector('#btn-save').addEventListener('click', async () => {
        const permissoes = {};
        content.querySelectorAll('[data-perm]').forEach((c) => (permissoes[c.dataset.perm] = c.checked));
        await window.db.savePerfil({
            ...perfil,
            nome: content.querySelector('#f-nome').value.trim(),
            descricao: content.querySelector('#f-desc').value.trim(),
            role: content.querySelector('#f-role').value,
            permissoes,
        });
        toast('Perfil salvo', 'success'); closeModal(); renderTab();
    });
}
