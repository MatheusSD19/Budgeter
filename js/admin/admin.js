// Budgeter - Admin Panel
// Coordena tabs: usuarios, perfis, filiais, ccs, classes, landing(importar/historico), volume.

import db, { MESES, MESES_NOMES, somaMeses } from '../database.js';
import { renderUsuariosTab } from './usuarios.js';
import { renderPerfisTab } from './perfis.js';
import { renderFiliaisTab } from './filiais.js';
import { renderCcsTab } from './ccs.js';
import { renderClassesTab } from './classes.js';
import { renderLandingImportTab } from './landing-import.js';
import { renderLandingHistoricoTab } from './landing-historico.js';
import { renderVolumeTab } from './volume.js';

const renderers = {
    usuarios: renderUsuariosTab,
    perfis: renderPerfisTab,
    filiais: renderFiliaisTab,
    ccs: renderCcsTab,
    classes: renderClassesTab,
    landing: renderLandingImportTab,
    historico: renderLandingHistoricoTab,
    volume: renderVolumeTab,
};

let currentTab = 'usuarios';

window.addEventListener('auth:ready', async (e) => {
    const auth = window.authManager;
    if (!auth.isAdmin && !auth.isFinanceiro) {
        document.getElementById('app').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
        return;
    }
    document.getElementById('user-email').textContent = e.detail.userData?.email || '';

    document.querySelectorAll('.admin-nav-item').forEach((btn) => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (!renderers[tab]) return;
            document.querySelectorAll('.admin-nav-item').forEach((b) => b.classList.toggle('active', b === btn));
            currentTab = tab;
            renderTab();
        });
    });

    // Esconde tabs sem permissão
    if (!auth.isAdmin) {
        document.querySelector('[data-tab="usuarios"]')?.classList.add('hidden');
        document.querySelector('[data-tab="perfis"]')?.classList.add('hidden');
        if (currentTab === 'usuarios' || currentTab === 'perfis') currentTab = 'filiais';
        document.querySelectorAll('.admin-nav-item').forEach((b) => b.classList.toggle('active', b.dataset.tab === currentTab));
    }

    renderTab();
});

async function renderTab() {
    const root = document.getElementById('tab-content');
    root.innerHTML = '<div class="muted">Carregando...</div>';
    try {
        await renderers[currentTab](root, { db, auth: window.authManager });
    } catch (err) {
        console.error(err);
        root.innerHTML = `<div class="error-state"><strong>Erro:</strong> ${err.message}</div>`;
    }
}

// Helpers compartilhados
export function toast(message, type = 'info') {
    const container = document.querySelector('.toast-container') || (() => {
        const c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); return c;
    })();
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = message;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}

export function openModal(content) {
    const root = document.getElementById('modal-root');
    root.innerHTML = '';
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.appendChild(content);
    backdrop.appendChild(modal);
    root.appendChild(backdrop);
}
export function closeModal() { document.getElementById('modal-root').innerHTML = ''; }
window.closeModal = closeModal;

// Logout
document.getElementById('btn-logout')?.addEventListener('click', () => {
    window.firebase.signOut(window.firebase.auth);
});

export { renderTab };
