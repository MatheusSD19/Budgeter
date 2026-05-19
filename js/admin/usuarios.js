// Admin: Gestão de usuários
// - lista usuários cadastrados no RTDB
// - cria registro de usuário a partir de UID existente (no Auth) ou cadastra novo via signup (apenas local/emulator)
// - vincula perfil, filiais e CCs específicos
// - ativar/desativar

import { toast, openModal, closeModal, renderTab } from './admin.js';
import { escapeHtml, escapeAttr } from './utils.js';

export async function renderUsuariosTab(root, { db, auth }) {
    const [usuarios, perfis, filiais] = await Promise.all([
        db.getUsuarios(true),
        db.getPerfis(true),
        db.getFiliais(true),
    ]);
    const ccsPorFilial = {};
    for (const fid of Object.keys(filiais)) {
        ccsPorFilial[fid] = await db.getCentrosCustoFilial(fid, true);
    }

    const userList = Object.values(usuarios).sort((a, b) => (a.email || '').localeCompare(b.email || ''));

    root.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'admin-card';
    card.innerHTML = `
        <div class="admin-card-header">
            <div>
                <h2>Usuários</h2>
                <p class="muted small">Vincule perfis, filiais e centros de custo a cada usuário.</p>
            </div>
            <div>
                <button class="btn btn-secondary btn-sm" id="btn-new-user-uid">Vincular UID existente</button>
                <button class="btn btn-primary btn-sm" id="btn-new-user">+ Novo usuário</button>
            </div>
        </div>
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Email</th><th>Nome</th><th>Papel</th><th>Perfil</th>
                    <th>Filiais</th><th>CCs específicos</th><th>Status</th><th></th>
                </tr>
            </thead>
            <tbody>
                ${userList.map((u) => `
                    <tr data-uid="${u.id}">
                        <td>${escapeHtml(u.email || '')}</td>
                        <td>${escapeHtml(u.nome || '')}</td>
                        <td><span class="badge badge-${badgeForRole(u.role)}">${u.role || '—'}</span></td>
                        <td>${escapeHtml(perfis[u.perfilId]?.nome || '—')}</td>
                        <td>${Object.keys(u.filiais || {}).length ? Object.keys(u.filiais).map(f => escapeHtml(filiais[f]?.codigo || f)).join(', ') : '<span class="muted">(todas)</span>'}</td>
                        <td>${Object.keys(u.ccIds || {}).length || '<span class="muted">(todas)</span>'}</td>
                        <td>${u.ativo === false ? '<span class="badge badge-negative">Inativo</span>' : '<span class="badge badge-positive">Ativo</span>'}</td>
                        <td>
                            <button class="btn btn-ghost btn-sm" data-action="edit">Editar</button>
                            <button class="btn btn-ghost btn-sm" data-action="toggle">${u.ativo === false ? 'Ativar' : 'Desativar'}</button>
                        </td>
                    </tr>`).join('')}
            </tbody>
        </table>
    `;
    root.appendChild(card);

    card.querySelectorAll('tr[data-uid]').forEach((tr) => {
        const uid = tr.dataset.uid;
        tr.querySelector('[data-action="edit"]')?.addEventListener('click', () => editarUsuario(uid, usuarios[uid], perfis, filiais, ccsPorFilial));
        tr.querySelector('[data-action="toggle"]')?.addEventListener('click', async () => {
            await db.setUsuarioAtivo(uid, usuarios[uid].ativo === false);
            toast('Status atualizado', 'success');
            renderTab();
        });
    });

    card.querySelector('#btn-new-user').addEventListener('click', () => criarUsuarioNovo(perfis, filiais, ccsPorFilial));
    card.querySelector('#btn-new-user-uid').addEventListener('click', () => vincularUidExistente(perfis, filiais, ccsPorFilial));
}

function badgeForRole(role) {
    return ({ admin: 'negative', financeiro: 'info', manager: 'warning', viewer: '' })[role] || '';
}

function formUsuario({ uid = '', email = '', nome = '', role = 'viewer', perfilId = '', filiais = {}, ccIds = {} }, perfis, filiaisAll, ccsPorFilial, opts = {}) {
    const perfilOpts = ['<option value="">— sem perfil —</option>',
        ...Object.values(perfis).map((p) => `<option value="${p.id}" ${p.id === perfilId ? 'selected' : ''}>${escapeHtml(p.nome)} (${p.role})</option>`)].join('');

    const filiaisChecks = Object.values(filiaisAll).map((f) => `
        <label class="check-pill">
            <input type="checkbox" data-filial="${f.id}" ${filiais[f.id] ? 'checked' : ''}>
            <span>${escapeHtml(f.codigo || f.nome)}</span>
        </label>`).join('');

    const ccsBloco = Object.values(filiaisAll).map((f) => `
        <div class="ccs-bloco" data-filial="${f.id}">
            <div class="muted small">${escapeHtml(f.nome)}</div>
            <div class="check-pills">
                ${Object.values(ccsPorFilial[f.id] || {}).map((cc) => `
                    <label class="check-pill">
                        <input type="checkbox" data-cc="${cc.id}" data-filial="${f.id}" ${ccIds[cc.id] ? 'checked' : ''}>
                        <span>${escapeHtml(cc.codigo)} · ${escapeHtml(cc.nome)}</span>
                    </label>`).join('')}
            </div>
        </div>`).join('');

    return `
        ${opts.uidInput ? `<div class="input-group">
            <label>UID do Firebase Auth ${opts.signupMode ? '<span class="muted">(deixe vazio para criar)</span>' : ''}</label>
            <input id="f-uid" value="${escapeAttr(uid)}" placeholder="ex.: kJ23..." ${opts.disableUid ? 'disabled' : ''}>
        </div>` : ''}
        ${opts.signupMode ? `<div class="input-group">
            <label>Senha inicial (apenas para criar conta nova)</label>
            <input id="f-senha" type="text" placeholder="mínimo 6 chars">
        </div>` : ''}
        <div class="grid-2">
            <div class="input-group">
                <label>Email</label>
                <input id="f-email" type="email" value="${escapeAttr(email)}" ${opts.disableEmail ? 'disabled' : ''}>
            </div>
            <div class="input-group">
                <label>Nome</label>
                <input id="f-nome" value="${escapeAttr(nome)}">
            </div>
        </div>
        <div class="grid-2">
            <div class="input-group">
                <label>Papel (role)</label>
                <select id="f-role" class="select-dark">
                    <option value="admin"      ${role === 'admin' ? 'selected' : ''}>admin</option>
                    <option value="financeiro" ${role === 'financeiro' ? 'selected' : ''}>financeiro</option>
                    <option value="manager"    ${role === 'manager' ? 'selected' : ''}>manager</option>
                    <option value="viewer"     ${role === 'viewer' ? 'selected' : ''}>viewer</option>
                </select>
            </div>
            <div class="input-group">
                <label>Perfil (template de permissões)</label>
                <select id="f-perfil" class="select-dark">${perfilOpts}</select>
            </div>
        </div>
        <div class="input-group">
            <label>Filiais com acesso</label>
            <div class="check-pills">${filiaisChecks}</div>
            <div class="muted small">Vazio = todas (apenas válido para admin/financeiro).</div>
        </div>
        <div class="input-group">
            <label>Centros de Custo específicos (opcional)</label>
            <div class="ccs-blocos">${ccsBloco}</div>
            <div class="muted small">Se vazio, o usuário acessa todos os CCs das filiais marcadas.</div>
        </div>
    `;
}

function lerFormUsuario(content) {
    const filiais = {};
    content.querySelectorAll('[data-filial]:not([data-cc]):checked').forEach((c) => (filiais[c.dataset.filial] = true));
    const ccIds = {};
    content.querySelectorAll('[data-cc]:checked').forEach((c) => (ccIds[c.dataset.cc] = true));
    return {
        uid: content.querySelector('#f-uid')?.value?.trim() || '',
        senha: content.querySelector('#f-senha')?.value || '',
        email: content.querySelector('#f-email').value.trim(),
        nome: content.querySelector('#f-nome').value.trim(),
        role: content.querySelector('#f-role').value,
        perfilId: content.querySelector('#f-perfil').value || null,
        filiais,
        ccIds,
    };
}

async function editarUsuario(uid, user, perfis, filiais, ccsPorFilial) {
    const content = document.createElement('div');
    content.className = 'modal-content modal-lg';
    content.innerHTML = `
        <div class="modal-header"><h3>Editar usuário</h3><button class="btn btn-ghost btn-icon" onclick="closeModal()">✕</button></div>
        <div class="modal-body">
            ${formUsuario({ ...user, uid }, perfis, filiais, ccsPorFilial, { uidInput: true, disableUid: true, disableEmail: true })}
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" id="btn-save">Salvar</button>
        </div>`;
    openModal(content);
    content.querySelector('#btn-save').addEventListener('click', async () => {
        const data = lerFormUsuario(content);
        await window.db.saveUsuario(uid, {
            ...user,
            email: user.email,
            nome: data.nome,
            role: data.role,
            perfilId: data.perfilId,
            filiais: data.filiais,
            ccIds: data.ccIds,
            ativo: user.ativo !== false,
        });
        toast('Usuário atualizado', 'success');
        closeModal();
        renderTab();
    });
}

async function vincularUidExistente(perfis, filiais, ccsPorFilial) {
    const content = document.createElement('div');
    content.className = 'modal-content modal-lg';
    content.innerHTML = `
        <div class="modal-header"><h3>Vincular UID existente</h3><button class="btn btn-ghost btn-icon" onclick="closeModal()">✕</button></div>
        <div class="modal-body">
            <p class="muted small">Use o UID do usuário que já existe no Firebase Authentication.</p>
            ${formUsuario({}, perfis, filiais, ccsPorFilial, { uidInput: true })}
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" id="btn-save">Salvar</button>
        </div>`;
    openModal(content);
    content.querySelector('#btn-save').addEventListener('click', async () => {
        const data = lerFormUsuario(content);
        if (!data.uid || !data.email) { toast('Informe UID e email', 'warning'); return; }
        await window.db.saveUsuario(data.uid, {
            id: data.uid,
            email: data.email, nome: data.nome, role: data.role,
            perfilId: data.perfilId, filiais: data.filiais, ccIds: data.ccIds,
            ativo: true, createdAt: Date.now(),
        });
        toast('Vinculado', 'success'); closeModal(); renderTab();
    });
}

async function criarUsuarioNovo(perfis, filiais, ccsPorFilial) {
    const content = document.createElement('div');
    content.className = 'modal-content modal-lg';
    const isLocal = window.firebase?.isLocal;
    content.innerHTML = `
        <div class="modal-header"><h3>Novo usuário</h3><button class="btn btn-ghost btn-icon" onclick="closeModal()">✕</button></div>
        <div class="modal-body">
            ${isLocal
                ? '<p class="muted small">No emulador local, a conta é criada diretamente. Em produção, peça ao usuário para se cadastrar (signup) e depois use "Vincular UID existente" ou crie a conta no Console do Firebase.</p>'
                : '<p class="muted small">⚠ Em produção, é necessário criar a conta no Console do Firebase (Auth) ou pedir ao usuário para se cadastrar. Aqui você apenas registra o vínculo (preencha o UID).</p>'}
            ${formUsuario({}, perfis, filiais, ccsPorFilial, { uidInput: !isLocal, signupMode: isLocal })}
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" id="btn-save">Salvar</button>
        </div>`;
    openModal(content);
    content.querySelector('#btn-save').addEventListener('click', async () => {
        const data = lerFormUsuario(content);
        if (!data.email) { toast('Email é obrigatório', 'warning'); return; }
        let uid = data.uid;
        try {
            if (isLocal && !uid) {
                if (!data.senha || data.senha.length < 6) { toast('Senha deve ter ao menos 6 chars', 'warning'); return; }
                const cred = await window.firebase.createUserWithEmailAndPassword(window.firebase.auth, data.email, data.senha);
                uid = cred.user.uid;
                toast('Conta criada no Auth (emulador)', 'success');
            }
            if (!uid) { toast('Informe o UID (Console do Firebase) ou cadastre no emulador local', 'warning'); return; }
            await window.db.saveUsuario(uid, {
                id: uid, email: data.email, nome: data.nome, role: data.role,
                perfilId: data.perfilId, filiais: data.filiais, ccIds: data.ccIds,
                ativo: true, createdAt: Date.now(),
            });
            toast('Usuário salvo', 'success'); closeModal(); renderTab();
        } catch (err) {
            console.error(err); toast('Falhou: ' + (err.message || err.code), 'error');
        }
    });
}
