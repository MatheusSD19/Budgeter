// Budgeter - Tools
// - Calculadora de Reajuste (% × meses selecionados)
// - Comparativo YoY (Budget atual vs Landing escolhido)
//
// Modais são renderizados em #modal-root.

import db, { MESES, MESES_NOMES, somaMeses } from './database.js';

function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
        if (k === 'class') node.className = v;
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else if (v === true) node.setAttribute(k, '');
        else if (v !== false && v != null) node.setAttribute(k, v);
    });
    for (const c of children.flat()) {
        if (c == null) continue;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
}

function openModal(content) {
    const root = document.getElementById('modal-root');
    root.innerHTML = '';
    const backdrop = el('div', { class: 'modal-backdrop', onclick: (e) => { if (e.target === backdrop) closeModal(); } });
    const modal = el('div', { class: 'modal' });
    modal.appendChild(content);
    backdrop.appendChild(modal);
    root.appendChild(backdrop);
}

function closeModal() {
    document.getElementById('modal-root').innerHTML = '';
}
window.closeModal = closeModal;

// ============================ REAJUSTE ============================

async function abrirReajuste() {
    const editor = window.budgetEditor;
    if (!editor?.state.filialId) {
        toast('Selecione uma filial primeiro', 'warning');
        return;
    }

    const linhasAlvo = editor.filtered();
    if (!linhasAlvo.length) {
        toast('Nenhuma linha no filtro atual para reajustar', 'warning');
        return;
    }

    const monthsHtml = MESES.map((m) => `
        <label class="check-pill">
            <input type="checkbox" data-mes="${m}" checked>
            <span>${MESES_NOMES[m].slice(0, 3)}</span>
        </label>`).join('');

    const content = el('div', { class: 'modal-content' });
    content.innerHTML = `
        <div class="modal-header">
            <h3>Aplicar reajuste em massa</h3>
            <button class="btn btn-ghost btn-icon" onclick="closeModal()">✕</button>
        </div>
        <div class="modal-body">
            <p class="muted">${linhasAlvo.length} linha(s) selecionada(s) pelo filtro atual.</p>

            <div class="input-group">
                <label>Percentual de reajuste (use sinal negativo para redução)</label>
                <input id="reajuste-pct" type="number" step="0.01" value="5" autofocus>
            </div>

            <div class="input-group">
                <label>Modo</label>
                <select id="reajuste-modo" class="select-dark">
                    <option value="aumentar">Aumentar valores existentes em %</option>
                    <option value="copiar-landing">Copiar do último Landing e aplicar %</option>
                </select>
            </div>

            <div class="input-group">
                <label>Meses afetados (padrão: todos)</label>
                <div class="check-pills">${monthsHtml}</div>
                <div class="muted small">
                    <button type="button" class="btn-link" id="rj-todos">Todos</button> ·
                    <button type="button" class="btn-link" id="rj-nenhum">Nenhum</button>
                </div>
            </div>

            <div class="muted small">Pré-visualização da soma anual após reajuste:</div>
            <div id="reajuste-preview" class="reajuste-preview">—</div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" id="btn-aplicar-reajuste">Aplicar</button>
        </div>
    `;

    openModal(content);

    const getMesesSelecionados = () =>
        [...content.querySelectorAll('[data-mes]:checked')].map((el) => el.dataset.mes);

    const updatePreview = async () => {
        const pct = Number(content.querySelector('#reajuste-pct').value) || 0;
        const modo = content.querySelector('#reajuste-modo').value;
        const meses = getMesesSelecionados();
        let base = 0, novo = 0;

        if (modo === 'copiar-landing') {
            const landing = await db.getLastLanding(editor.state.ano - 1) || await db.getLastLanding(editor.state.ano);
            const map = new Map();
            for (const l of Object.values(landing?.linhas || {})) {
                map.set(`${l.ccId}|${l.classeId}|${(l.descricao || '').toLowerCase()}`, l);
            }
            linhasAlvo.forEach((l) => {
                const lm = map.get(`${l.ccId}|${l.classeId}|${(l.descricao || '').toLowerCase()}`);
                if (!lm) return;
                base += somaMeses(lm);
                meses.forEach((m) => (novo += (Number(lm[m]) || 0) * (1 + pct / 100)));
            });
        } else {
            linhasAlvo.forEach((l) => {
                base += somaMeses(l);
                meses.forEach((m) => (novo += (Number(l[m]) || 0) * (1 + pct / 100)));
                // Meses não afetados continuam iguais
                MESES.filter((m) => !meses.includes(m)).forEach((m) => (novo += Number(l[m]) || 0));
            });
        }
        content.querySelector('#reajuste-preview').textContent =
            `Base: ${window.formatters.currency(base)} → Novo total: ${window.formatters.currency(novo)} (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)`;
    };

    content.querySelector('#reajuste-pct').addEventListener('input', updatePreview);
    content.querySelector('#reajuste-modo').addEventListener('change', updatePreview);
    content.querySelectorAll('[data-mes]').forEach((el) => el.addEventListener('change', updatePreview));
    content.querySelector('#rj-todos').addEventListener('click', () => {
        content.querySelectorAll('[data-mes]').forEach((el) => (el.checked = true));
        updatePreview();
    });
    content.querySelector('#rj-nenhum').addEventListener('click', () => {
        content.querySelectorAll('[data-mes]').forEach((el) => (el.checked = false));
        updatePreview();
    });
    updatePreview();

    content.querySelector('#btn-aplicar-reajuste').addEventListener('click', async () => {
        const pct = Number(content.querySelector('#reajuste-pct').value) || 0;
        const modo = content.querySelector('#reajuste-modo').value;
        const meses = getMesesSelecionados();
        if (!meses.length) { toast('Selecione ao menos um mês', 'warning'); return; }

        let landingMap = null;
        if (modo === 'copiar-landing') {
            const landing = await db.getLastLanding(editor.state.ano - 1) || await db.getLastLanding(editor.state.ano);
            landingMap = new Map();
            for (const l of Object.values(landing?.linhas || {})) {
                landingMap.set(`${l.ccId}|${l.classeId}|${(l.descricao || '').toLowerCase()}`, l);
            }
        }

        for (const l of linhasAlvo) {
            const source = landingMap
                ? (landingMap.get(`${l.ccId}|${l.classeId}|${(l.descricao || '').toLowerCase()}`) || l)
                : l;
            const upd = { ...l };
            for (const m of MESES) {
                const base = Number(source[m]) || 0;
                upd[m] = meses.includes(m) ? round2(base * (1 + pct / 100)) : (modo === 'copiar-landing' ? base : (Number(l[m]) || 0));
            }
            upd.total = somaMeses(upd);
            await db.saveBudgetLinha(upd);
        }
        toast(`Reajuste de ${pct}% aplicado em ${linhasAlvo.length} linha(s)`, 'success');
        closeModal();
        await editor.reload();
    });
}

// ============================ YoY ============================

async function abrirYoY() {
    const editor = window.budgetEditor;
    if (!editor?.state.filialId) { toast('Selecione uma filial', 'warning'); return; }
    const ano = editor.state.ano;
    const anoLanding = ano - 1;

    const [budget, landings, classes] = await Promise.all([
        db.getBudgetLinhas(ano, editor.state.filialId),
        db.getLandingsAno(anoLanding),
        db.getClassesCusto(),
    ]);
    const landingsList = Object.values(landings).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const landing = landingsList[0];

    if (!landing) {
        toast(`Nenhum Landing ${anoLanding} cadastrado. Importe via painel Admin.`, 'warning', 5000);
        return;
    }

    const landingMap = new Map();
    for (const l of Object.values(landing.linhas || {})) {
        landingMap.set(`${l.ccId}|${l.classeId}|${(l.descricao || '').toLowerCase()}`, l);
    }

    const ccs = await db.getCentrosCustoFilial(editor.state.filialId);

    const rows = budget.map((b) => {
        const lm = landingMap.get(`${b.ccId}|${b.classeId}|${(b.descricao || '').toLowerCase()}`);
        const totalB = somaMeses(b);
        const totalL = lm ? somaMeses(lm) : 0;
        const diff = totalB - totalL;
        const pct = totalL > 0 ? (diff / totalL) * 100 : (totalB > 0 ? 100 : 0);
        return {
            cc: ccs[b.ccId]?.codigo || b.ccId,
            classe: classes[b.classeId]?.codigo || b.classeId,
            descricao: b.descricao || '',
            budget: totalB, landing: totalL, diff, pct,
            ccId: b.ccId, linhaKey: b.id,
        };
    });
    rows.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

    const justifs = await db.getJustificativasFilial(ano, editor.state.filialId);

    const trs = rows.map((r) => `
        <tr>
            <td>${escapeHtml(r.cc)}</td>
            <td>${escapeHtml(r.classe)}</td>
            <td>${escapeHtml(r.descricao)}</td>
            <td class="num">${window.formatters.currency(r.landing)}</td>
            <td class="num">${window.formatters.currency(r.budget)}</td>
            <td class="num ${r.diff >= 0 ? 'pos' : 'neg'}">${window.formatters.currency(r.diff)}</td>
            <td class="num ${r.diff >= 0 ? 'pos' : 'neg'}">${r.pct.toFixed(1)}%</td>
            <td><input class="just-input" data-cc="${r.ccId}" data-key="${r.linhaKey}" value="${escapeAttr(justifs?.[r.ccId]?.[r.linhaKey]?.texto || '')}" placeholder="Justificativa..."></td>
        </tr>`).join('');

    const totalLanding = rows.reduce((s, r) => s + r.landing, 0);
    const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
    const totalDiff = totalBudget - totalLanding;

    const content = el('div', { class: 'modal-content modal-lg' });
    content.innerHTML = `
        <div class="modal-header">
            <h3>Comparativo Budget ${ano} vs Landing ${anoLanding}</h3>
            <button class="btn btn-ghost btn-icon" onclick="closeModal()">✕</button>
        </div>
        <div class="modal-body">
            <p class="muted">Landing usado: <strong>${escapeHtml(landing.nome || landing.id)}</strong></p>
            <div class="yoy-summary">
                <div><span class="muted">Landing ${anoLanding}:</span> ${window.formatters.currency(totalLanding)}</div>
                <div><span class="muted">Budget ${ano}:</span> ${window.formatters.currency(totalBudget)}</div>
                <div class="${totalDiff >= 0 ? 'pos' : 'neg'}"><span class="muted">Variação:</span> ${window.formatters.currency(totalDiff)} (${totalLanding > 0 ? ((totalDiff / totalLanding) * 100).toFixed(1) : '—'}%)</div>
            </div>
            <div class="table-container yoy-table-wrap">
                <table class="budget-table yoy-table">
                    <thead>
                        <tr>
                            <th>CC</th><th>Classe</th><th>Descrição</th>
                            <th class="num">Landing ${anoLanding}</th>
                            <th class="num">Budget ${ano}</th>
                            <th class="num">Variação R$</th>
                            <th class="num">%</th>
                            <th>Justificativa</th>
                        </tr>
                    </thead>
                    <tbody>${trs}</tbody>
                </table>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal()">Fechar</button>
            <button class="btn btn-primary" id="btn-salvar-just">Salvar justificativas</button>
        </div>
    `;

    openModal(content);
    content.querySelector('#btn-salvar-just').addEventListener('click', async () => {
        const inputs = content.querySelectorAll('.just-input');
        const promises = [];
        inputs.forEach((i) => {
            const t = i.value.trim();
            if (!t) return;
            promises.push(db.saveJustificativa(ano, editor.state.filialId, i.dataset.cc, i.dataset.key, t));
        });
        await Promise.all(promises);
        toast('Justificativas salvas', 'success');
        closeModal();
    });
}

// ============================ utils ============================

function round2(n) { return Math.round(n * 100) / 100; }
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function escapeAttr(s) { return escapeHtml(s).replace(/'/g, '&#39;'); }
function toast(msg, type) { window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: msg, type } })); }

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-reajuste')?.addEventListener('click', abrirReajuste);
    document.getElementById('btn-yoy')?.addEventListener('click', abrirYoY);
});

export { abrirReajuste, abrirYoY };
