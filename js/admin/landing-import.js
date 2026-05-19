// Admin: Importar Landing (CSV ou Excel)
// Lê arquivo com colunas:
//   Centro de Custo | Budget | Filial | Fimmo | Classe de Custo | Descrição Classe
//   Grupo Geral | Sub-Grupo | Descrição Despesa
//   Janeiro..Dezembro | RESPONSÁVEIS | OUTRAS OBSERVAÇÕES
//
// Comportamento:
//  - Auto-cadastra Filial, Centros de Custo e Classes que ainda não existem.
//  - Salva uma nova versão de Landing em landings/{ano}/{versionId}.
//  - Opcional: aplicar como Budget atual em budgets/{ano}/...

import { toast } from './admin.js';
import { escapeHtml } from './utils.js';
import { MESES, MESES_NOMES, somaMeses } from '../database.js';

// Carrega SheetJS sob demanda
async function loadSheetJS() {
    if (window.XLSX) return window.XLSX;
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        s.onload = () => resolve(window.XLSX);
        s.onerror = () => reject(new Error('Falha ao carregar SheetJS'));
        document.head.appendChild(s);
    });
}

// Aliases das colunas (lowercase, sem acentos)
const ALIASES = {
    cc: ['centrodecusto', 'cc', 'centrocusto', 'codigocc', 'codigocentrocusto'],
    ccNome: ['nomecc', 'descricaocc', 'nomecentrocusto'],
    budget: ['budget', 'categoriabudget', 'categoria'],
    filial: ['filial', 'unidade'],
    fimmo: ['fimmo', 'codigoexterno', 'codigofimmo'],
    classeCod: ['classedecusto', 'classe', 'codigoclasse', 'classecusto'],
    classeDesc: ['descricaoclasse', 'descricaodaclasse', 'nomeclasse'],
    grupo: ['grupogeral'],
    subgrupo: ['subgrupo', 'subgrupo'],
    descricao: ['descricaodespesa', 'despesa', 'descricao'],
    responsaveis: ['responsaveis', 'responsavel'],
    obs: ['outrasobservacoes', 'observacoes', 'obs'],
};
const MESES_HEADERS = {
    jan: ['janeiro', 'jan'],
    fev: ['fevereiro', 'fev'],
    mar: ['marco', 'mar'],
    abr: ['abril', 'abr'],
    mai: ['maio', 'mai'],
    jun: ['junho', 'jun'],
    jul: ['julho', 'jul'],
    ago: ['agosto', 'ago'],
    set: ['setembro', 'set'],
    out: ['outubro', 'out'],
    nov: ['novembro', 'nov'],
    dez: ['dezembro', 'dez'],
};

function normalizeKey(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function buildColumnMap(headers) {
    const map = {};
    const normalized = headers.map((h) => normalizeKey(h));
    function find(aliases) {
        for (const al of aliases) {
            const idx = normalized.indexOf(al);
            if (idx !== -1) return idx;
        }
        return -1;
    }
    for (const [k, aliases] of Object.entries(ALIASES)) {
        map[k] = find(aliases);
    }
    map.meses = {};
    for (const [m, aliases] of Object.entries(MESES_HEADERS)) {
        map.meses[m] = find(aliases);
    }
    return map;
}

function parseMoeda(v) {
    if (v == null || v === '') return 0;
    if (typeof v === 'number') return v;
    const s = String(v).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
}

function parseCSV(text) {
    // Detecta separador
    const firstLine = text.split(/\r?\n/, 1)[0];
    const sep = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
    const rows = [];
    let cur = ''; let inQ = false; let row = [];
    for (const ch of text) {
        if (ch === '"') { inQ = !inQ; continue; }
        if (!inQ && ch === sep) { row.push(cur); cur = ''; continue; }
        if (!inQ && (ch === '\n' || ch === '\r')) {
            if (cur !== '' || row.length) { row.push(cur); rows.push(row); row = []; cur = ''; }
            continue;
        }
        cur += ch;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
}

async function parseArquivo(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.csv') || name.endsWith('.tsv')) {
        const text = await file.text();
        return parseCSV(text);
    }
    const XLSX = await loadSheetJS();
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' });
}

export async function renderLandingImportTab(root, { db, auth }) {
    if (!auth.canImportLanding()) {
        root.innerHTML = '<div class="empty-state"><h3>Sem permissão</h3><p>Apenas Financeiro/Admin podem importar Landing.</p></div>';
        return;
    }

    const filiais = await db.getFiliais(true);
    const filiaisList = Object.values(filiais);
    const anoAtual = new Date().getFullYear();

    root.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'admin-card';
    card.innerHTML = `
        <div class="admin-card-header">
            <div>
                <h2>Importar Landing</h2>
                <p class="muted small">CSV (vírgula ou ponto-vírgula) ou Excel (.xlsx). Cria automaticamente Filiais, CCs e Classes que ainda não existem.</p>
            </div>
        </div>
        <div class="form-grid">
            <div class="input-group">
                <label>Ano do Landing</label>
                <input id="li-ano" type="number" value="${anoAtual - 1}">
            </div>
            <div class="input-group">
                <label>Nome da versão</label>
                <input id="li-nome" placeholder="Ex.: Landing fechamento 12/${anoAtual - 1}">
            </div>
            <div class="input-group">
                <label>Filial padrão (quando não informado na planilha)</label>
                <select id="li-filial" class="select-dark">
                    <option value="">— criar a partir do arquivo —</option>
                    ${filiaisList.map((f) => `<option value="${f.id}">${escapeHtml(f.codigo || '')} · ${escapeHtml(f.nome)}</option>`).join('')}
                </select>
            </div>
            <div class="input-group">
                <label>Aplicar também como Budget de:</label>
                <select id="li-budget" class="select-dark">
                    <option value="">Não aplicar como Budget</option>
                    <option value="${anoAtual}">${anoAtual}</option>
                    <option value="${anoAtual + 1}">${anoAtual + 1}</option>
                </select>
            </div>
        </div>
        <div class="input-group">
            <label>Arquivo (.csv, .xlsx)</label>
            <input id="li-file" type="file" accept=".csv,.tsv,.xlsx,.xls">
        </div>
        <div id="li-preview" class="muted">Carregue um arquivo para visualizar.</div>
        <div class="modal-footer" style="margin-top:16px">
            <button class="btn btn-primary" id="li-import" disabled>Importar</button>
        </div>
    `;
    root.appendChild(card);

    let parsedRows = null;
    let colMap = null;

    card.querySelector('#li-file').addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const rows = await parseArquivo(file);
            if (rows.length < 2) throw new Error('Arquivo vazio ou sem cabeçalho.');
            const headers = rows[0].map((h) => String(h).trim());
            colMap = buildColumnMap(headers);
            parsedRows = rows.slice(1);

            const obrigatorios = ['cc', 'classeCod', 'descricao'];
            const faltando = obrigatorios.filter((k) => colMap[k] === -1);
            const mesesFaltando = MESES.filter((m) => colMap.meses[m] === -1);
            const previewLines = parsedRows.slice(0, 5);

            card.querySelector('#li-preview').innerHTML = `
                <strong>${parsedRows.length}</strong> linhas detectadas.<br>
                Colunas identificadas:
                <ul class="muted small">
                    ${Object.entries(colMap).filter(([k]) => k !== 'meses').map(([k, idx]) =>
                        `<li>${k}: ${idx === -1 ? '<span class="neg">não encontrada</span>' : `<code>${escapeHtml(headers[idx])}</code>`}</li>`).join('')}
                    <li>meses: ${MESES.map((m) => colMap.meses[m] === -1 ? `<span class="neg">${m}</span>` : `<code>${m}</code>`).join(' ')}</li>
                </ul>
                ${faltando.length ? `<div class="error-state">Colunas obrigatórias ausentes: ${faltando.join(', ')}.</div>` : ''}
                ${mesesFaltando.length === 12 ? '<div class="error-state">Nenhuma coluna de mês encontrada.</div>' : ''}
                <details><summary>Primeiras linhas</summary>
                    <pre class="preview">${escapeHtml(previewLines.map(r => r.join(' | ')).join('\n'))}</pre>
                </details>
            `;
            card.querySelector('#li-import').disabled = faltando.length > 0 || mesesFaltando.length === 12;
        } catch (err) {
            console.error(err);
            card.querySelector('#li-preview').innerHTML = `<div class="error-state">${escapeHtml(err.message)}</div>`;
        }
    });

    card.querySelector('#li-import').addEventListener('click', async () => {
        if (!parsedRows) return;
        const ano = Number(card.querySelector('#li-ano').value) || anoAtual - 1;
        const nome = card.querySelector('#li-nome').value.trim() || `Landing ${ano} (${new Date().toLocaleDateString('pt-BR')})`;
        const filialDefault = card.querySelector('#li-filial').value;
        const aplicarBudget = card.querySelector('#li-budget').value;

        const btn = card.querySelector('#li-import');
        btn.disabled = true; btn.textContent = 'Importando...';

        try {
            const result = await importar({
                rows: parsedRows, colMap, ano, nome, filialDefault, aplicarBudgetAno: aplicarBudget,
            });
            toast(`Landing importado: ${result.totalLinhas} linhas. Versão: ${result.versionId}.`, 'success');
            card.querySelector('#li-preview').innerHTML += `
                <div style="margin-top:12px;color:var(--status-positive)">
                    ✓ Concluído. ${result.criados.filiais} filiais, ${result.criados.ccs} CCs e ${result.criados.classes} classes criados.
                    ${aplicarBudget ? `Também replicado como Budget ${aplicarBudget}.` : ''}
                </div>`;
        } catch (err) {
            console.error(err);
            toast('Erro: ' + err.message, 'error', 6000);
        } finally {
            btn.disabled = false; btn.textContent = 'Importar';
        }
    });
}

async function importar({ rows, colMap, ano, nome, filialDefault, aplicarBudgetAno }) {
    const db = window.db;
    const filiais = await db.getFiliais(true);
    const classes = await db.getClassesCusto(true);
    const ccsCache = {};

    const criados = { filiais: 0, ccs: 0, classes: 0 };
    const linhas = {};
    const budgetTree = {};

    const getCell = (row, idx) => idx === -1 ? '' : String(row[idx] ?? '').trim();
    const getMes = (row, m) => parseMoeda(row[colMap.meses[m]]);

    let i = 0;
    for (const row of rows) {
        i++;
        const ccCodigo = getCell(row, colMap.cc);
        const classeCodigo = getCell(row, colMap.classeCod);
        const descricao = getCell(row, colMap.descricao);
        if (!ccCodigo || !classeCodigo || !descricao) continue;

        const filialCodigo = getCell(row, colMap.filial);
        const filialFimmo = getCell(row, colMap.fimmo);
        const filialId = await ensureFilial(filiais, criados, filialDefault, filialCodigo, filialFimmo);

        const ccId = await ensureCC(db, ccsCache, criados, filialId, ccCodigo, getCell(row, colMap.budget));

        const classeDescricao = getCell(row, colMap.classeDesc);
        const grupo = getCell(row, colMap.grupo);
        const sub = getCell(row, colMap.subgrupo);
        const classeId = await ensureClasse(db, classes, criados, classeCodigo, classeDescricao, grupo, sub);

        const linhaId = `lnd_${i.toString().padStart(5, '0')}`;
        const linha = {
            id: linhaId,
            filialId, ccId, classeId,
            descricao,
            responsaveis: getCell(row, colMap.responsaveis),
            observacoes: getCell(row, colMap.obs),
        };
        for (const m of MESES) linha[m] = getMes(row, m);
        linha.total = somaMeses(linha);
        linhas[linhaId] = linha;

        if (aplicarBudgetAno) {
            budgetTree[filialId] = budgetTree[filialId] || {};
            budgetTree[filialId][ccId] = budgetTree[filialId][ccId] || {};
            budgetTree[filialId][ccId][classeId] = budgetTree[filialId][ccId][classeId] || {};
            budgetTree[filialId][ccId][classeId][linhaId] = { ...linha, ano: Number(aplicarBudgetAno), updatedAt: Date.now() };
        }
    }

    const versionId = 'v' + Date.now();
    const versao = {
        id: versionId,
        ano,
        versao: versionId,
        nome,
        createdAt: Date.now(),
        createdBy: window.authManager.userData?.email || 'desconhecido',
        totalLinhas: Object.keys(linhas).length,
        linhas,
    };
    await db.saveLandingVersion(ano, versao);

    if (aplicarBudgetAno) {
        const updates = {};
        for (const [fid, ccs] of Object.entries(budgetTree)) {
            for (const [cid, cls] of Object.entries(ccs)) {
                for (const [clId, ds] of Object.entries(cls)) {
                    for (const [lid, l] of Object.entries(ds)) {
                        updates[`budgets/${aplicarBudgetAno}/${fid}/${cid}/${clId}/${lid}`] = l;
                    }
                }
            }
        }
        const fb = window.firebase;
        await fb.update(fb.ref(fb.db), updates);
    }

    return { versionId, totalLinhas: versao.totalLinhas, criados };
}

async function ensureFilial(filiais, criados, defaultId, codigo, fimmo) {
    if (defaultId && !codigo) return defaultId;
    if (codigo) {
        const existing = Object.values(filiais).find((f) =>
            (f.codigo || '').toLowerCase() === codigo.toLowerCase() ||
            (f.nome || '').toLowerCase() === codigo.toLowerCase() ||
            (fimmo && (f.fimmo || '').toLowerCase() === fimmo.toLowerCase()));
        if (existing) return existing.id;

        const novo = await window.db.saveFilial({
            codigo: codigo.toUpperCase().slice(0, 8) || codigo,
            nome: codigo, fimmo, ativo: true, ordem: Object.keys(filiais).length + 1,
        });
        filiais[novo.id] = novo;
        criados.filiais++;
        return novo.id;
    }
    if (defaultId) return defaultId;
    throw new Error('Filial não definida em linha do arquivo e sem padrão selecionado.');
}

async function ensureCC(db, cache, criados, filialId, codigo, budget) {
    cache[filialId] = cache[filialId] || (await db.getCentrosCustoFilial(filialId, true));
    const existing = cache[filialId][codigo];
    if (existing) return existing.id;

    const novo = await db.saveCentroCusto({
        filialId,
        codigo,
        id: codigo,
        nome: budget || `CC ${codigo}`,
        budget: budget || '',
        ativo: true,
        ordem: Object.keys(cache[filialId]).length + 1,
    });
    cache[filialId][novo.id] = novo;
    criados.ccs++;
    return novo.id;
}

async function ensureClasse(db, classes, criados, codigo, descricao, grupo, subGrupo) {
    if (classes[codigo]) return codigo;
    const novo = await db.saveClasseCusto({
        id: codigo, codigo, descricao: descricao || `Classe ${codigo}`,
        grupoGeral: grupo || '', subGrupo: subGrupo || '',
    });
    classes[codigo] = novo;
    criados.classes++;
    return codigo;
}
