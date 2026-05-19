// Admin: Volume (Budget e Landing) por Filial/Ano
// Tabela simples com 12 meses para cada tipo.

import { toast } from './admin.js';
import { escapeHtml, escapeAttr } from './utils.js';
import { MESES, MESES_NOMES, somaMeses } from '../database.js';

export async function renderVolumeTab(root, { db }) {
    const filiais = await db.getFiliais(true);
    const filiaisList = Object.values(filiais);
    if (!filiaisList.length) {
        root.innerHTML = '<div class="empty-state"><h3>Sem filiais</h3><p>Cadastre uma filial primeiro.</p></div>';
        return;
    }
    const anoAtual = new Date().getFullYear();

    root.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'admin-card';
    card.innerHTML = `
        <div class="admin-card-header">
            <div>
                <h2>Volume (Budget &amp; Landing)</h2>
                <p class="muted small">Informe o volume mensal por filial. Pode ser usado em comparativos ou análises.</p>
            </div>
            <div>
                <select id="v-filial" class="select-dark">
                    ${filiaisList.map((f) => `<option value="${f.id}">${escapeHtml(f.codigo || '')} · ${escapeHtml(f.nome)}</option>`).join('')}
                </select>
                <select id="v-ano" class="select-dark">
                    ${[anoAtual - 1, anoAtual, anoAtual + 1].map((y) => `<option value="${y}" ${y === anoAtual ? 'selected' : ''}>${y}</option>`).join('')}
                </select>
            </div>
        </div>
        <div id="v-content"></div>
    `;
    root.appendChild(card);

    const renderForms = async () => {
        const filialId = card.querySelector('#v-filial').value;
        const ano = Number(card.querySelector('#v-ano').value);
        const [budget, landing] = await Promise.all([
            db.getVolume(ano, filialId, 'budget'),
            db.getVolume(ano, filialId, 'landing'),
        ]);
        const target = card.querySelector('#v-content');
        target.innerHTML = `
            ${tabela('Budget', 'budget', budget)}
            ${tabela('Landing (realizado)', 'landing', landing)}
        `;
        ['budget', 'landing'].forEach((tipo) => {
            const form = target.querySelector(`[data-tipo="${tipo}"]`);
            form.querySelector('[data-action="save"]').addEventListener('click', async () => {
                const data = lerForm(form);
                await db.saveVolume(ano, filialId, tipo, data);
                toast(`Volume ${tipo} salvo`, 'success');
                renderForms();
            });
        });
    };

    card.querySelector('#v-filial').addEventListener('change', renderForms);
    card.querySelector('#v-ano').addEventListener('change', renderForms);
    renderForms();
}

function tabela(titulo, tipo, dados = {}) {
    const total = somaMeses(dados);
    return `
        <div class="volume-block" data-tipo="${tipo}">
            <div class="admin-card-header">
                <h3>${titulo}</h3>
                <div>
                    <input data-field="unidade" placeholder="Unidade (ex.: ton, m³)" value="${escapeAttr(dados.unidade || '')}" style="width:160px">
                    <input data-field="descricao" placeholder="Descrição" value="${escapeAttr(dados.descricao || '')}" style="width:260px">
                </div>
            </div>
            <table class="budget-table">
                <thead>
                    <tr>${MESES.map((m) => `<th class="col-mes">${MESES_NOMES[m].slice(0, 3)}</th>`).join('')}<th class="col-total">Total</th></tr>
                </thead>
                <tbody>
                    <tr>
                        ${MESES.map((m) => `<td class="col-mes"><input data-field="${m}" value="${dados[m] ?? ''}" type="number" step="0.01"></td>`).join('')}
                        <td class="col-total" data-total>${window.formatters.number(total, 2)}</td>
                    </tr>
                </tbody>
            </table>
            <div class="modal-footer" style="margin-top:8px">
                <button class="btn btn-primary btn-sm" data-action="save">Salvar ${titulo}</button>
            </div>
        </div>
    `;
}

function lerForm(form) {
    const data = {
        unidade: form.querySelector('[data-field="unidade"]').value,
        descricao: form.querySelector('[data-field="descricao"]').value,
    };
    for (const m of MESES) {
        const v = Number(form.querySelector(`[data-field="${m}"]`).value);
        data[m] = Number.isFinite(v) ? v : 0;
    }
    return data;
}
