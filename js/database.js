// Budgeter - Database (schema v2)
// Hierarquia: Filial → Centro de Custo → Classe de Custo → Despesa
// Entidades extras: perfis, usuarios, landings (versionado), volumes, justificativas
//
// Convenções de caminho no RTDB:
//   filiais/{filialId}
//   centrosCusto/{filialId}/{ccId}
//   classesCusto/{classeId}                          (catálogo global)
//   budgets/{ano}/{filialId}/{ccId}/{classeId}/{despesaId}
//   landings/{ano}/{versionId}                       (snapshot completo)
//   volumes/{ano}/{filialId}/{tipo}                  (tipo: 'budget' | 'landing')
//   perfis/{perfilId}
//   usuarios/{uid}
//   justificativas/{ano}/{filialId}/{ccId}/{linhaId}

const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const MESES_NOMES = {
    jan: 'Janeiro', fev: 'Fevereiro', mar: 'Março', abr: 'Abril',
    mai: 'Maio',    jun: 'Junho',     jul: 'Julho', ago: 'Agosto',
    set: 'Setembro',out: 'Outubro',   nov: 'Novembro', dez: 'Dezembro',
};

function ensureFirebase() {
    if (!window.firebase) {
        throw new Error('Firebase ainda não inicializou. Aguarde o evento firebase:ready.');
    }
}

class Database {
    constructor() {
        this.cache = {
            filiais: null,
            centrosCusto: {},
            classesCusto: null,
            perfis: null,
            usuarios: null,
        };
    }

    get fb()   { ensureFirebase(); return window.firebase; }
    get db()   { return this.fb.db; }
    get _ref() { return this.fb.ref; }
    get _get() { return this.fb.get; }
    get _set() { return this.fb.set; }
    get _update() { return this.fb.update; }
    get _push() { return this.fb.push; }
    get _remove() { return this.fb.remove; }
    get _onValue() { return this.fb.onValue; }
    get _off() { return this.fb.off; }

    // -------------------- FILIAIS --------------------

    async getFiliais(force = false) {
        if (this.cache.filiais && !force) return this.cache.filiais;
        const snap = await this._get(this._ref(this.db, 'filiais'));
        this.cache.filiais = snap.exists() ? snap.val() : {};
        return this.cache.filiais;
    }

    async saveFilial(filial) {
        if (!filial.id) filial.id = 'filial_' + (filial.codigo || Date.now()).toString().toLowerCase().replace(/\s+/g, '_');
        const payload = { ...filial, updatedAt: Date.now() };
        await this._update(this._ref(this.db), { [`filiais/${filial.id}`]: payload });
        this.cache.filiais = null;
        return payload;
    }

    async deleteFilial(filialId) {
        await this._remove(this._ref(this.db, `filiais/${filialId}`));
        this.cache.filiais = null;
    }

    // -------------------- CENTROS DE CUSTO --------------------

    async getCentrosCustoFilial(filialId, force = false) {
        if (this.cache.centrosCusto[filialId] && !force) return this.cache.centrosCusto[filialId];
        const snap = await this._get(this._ref(this.db, `centrosCusto/${filialId}`));
        this.cache.centrosCusto[filialId] = snap.exists() ? snap.val() : {};
        return this.cache.centrosCusto[filialId];
    }

    async saveCentroCusto(cc) {
        if (!cc.filialId) throw new Error('CC precisa de filialId');
        if (!cc.id) cc.id = (cc.codigo || Date.now()).toString();
        const payload = { ...cc, updatedAt: Date.now() };
        await this._update(this._ref(this.db), { [`centrosCusto/${cc.filialId}/${cc.id}`]: payload });
        delete this.cache.centrosCusto[cc.filialId];
        return payload;
    }

    async deleteCentroCusto(filialId, ccId) {
        await this._remove(this._ref(this.db, `centrosCusto/${filialId}/${ccId}`));
        delete this.cache.centrosCusto[filialId];
    }

    // -------------------- CLASSES DE CUSTO --------------------

    async getClassesCusto(force = false) {
        if (this.cache.classesCusto && !force) return this.cache.classesCusto;
        const snap = await this._get(this._ref(this.db, 'classesCusto'));
        this.cache.classesCusto = snap.exists() ? snap.val() : {};
        return this.cache.classesCusto;
    }

    async saveClasseCusto(classe) {
        if (!classe.id) classe.id = (classe.codigo || Date.now()).toString();
        const payload = { ...classe, updatedAt: Date.now() };
        await this._update(this._ref(this.db), { [`classesCusto/${classe.id}`]: payload });
        this.cache.classesCusto = null;
        return payload;
    }

    async deleteClasseCusto(classeId) {
        await this._remove(this._ref(this.db, `classesCusto/${classeId}`));
        this.cache.classesCusto = null;
    }

    // -------------------- BUDGETS (por ano) --------------------

    async getBudgetFilial(ano, filialId) {
        const snap = await this._get(this._ref(this.db, `budgets/${ano}/${filialId}`));
        return snap.exists() ? snap.val() : {};
    }

    /**
     * Lista todas as despesas de uma filial em formato achatado.
     * Retorna: [{ id, filialId, ccId, classeId, descricao, responsaveis, observacoes, jan..dez, total }]
     */
    async getBudgetLinhas(ano, filialId) {
        const tree = await this.getBudgetFilial(ano, filialId);
        const linhas = [];
        for (const [ccId, classes] of Object.entries(tree)) {
            for (const [classeId, despesas] of Object.entries(classes)) {
                for (const [despesaId, despesa] of Object.entries(despesas)) {
                    linhas.push({ ...despesa, id: despesaId, ccId, classeId, filialId, ano });
                }
            }
        }
        return linhas;
    }

    async saveBudgetLinha(linha) {
        const { ano, filialId, ccId, classeId } = linha;
        if (!ano || !filialId || !ccId || !classeId) {
            throw new Error('Linha precisa de ano, filialId, ccId, classeId');
        }
        if (!linha.id) linha.id = 'despesa_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        const total = somaMeses(linha);
        const payload = { ...linha, total, updatedAt: Date.now() };
        const path = `budgets/${ano}/${filialId}/${ccId}/${classeId}/${linha.id}`;
        await this._update(this._ref(this.db), { [path]: payload });
        return payload;
    }

    async deleteBudgetLinha(ano, filialId, ccId, classeId, linhaId) {
        await this._remove(this._ref(this.db, `budgets/${ano}/${filialId}/${ccId}/${classeId}/${linhaId}`));
    }

    onBudgetFilialChange(ano, filialId, callback) {
        const r = this._ref(this.db, `budgets/${ano}/${filialId}`);
        const listener = this._onValue(r, (snap) => callback(snap.exists() ? snap.val() : {}));
        return () => this._off(r, 'value', listener);
    }

    // -------------------- LANDINGS (versionado) --------------------

    async getLandingsAno(ano) {
        const snap = await this._get(this._ref(this.db, `landings/${ano}`));
        return snap.exists() ? snap.val() : {};
    }

    async getLanding(ano, versionId) {
        const snap = await this._get(this._ref(this.db, `landings/${ano}/${versionId}`));
        return snap.exists() ? snap.val() : null;
    }

    async getLastLanding(ano) {
        const versions = await this.getLandingsAno(ano);
        const sorted = Object.values(versions).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        return sorted[0] || null;
    }

    async saveLandingVersion(ano, landing) {
        const versionId = landing.id || ('v' + Date.now());
        const payload = {
            ...landing,
            id: versionId,
            ano,
            createdAt: landing.createdAt || Date.now(),
        };
        await this._update(this._ref(this.db), { [`landings/${ano}/${versionId}`]: payload });
        return payload;
    }

    async deleteLandingVersion(ano, versionId) {
        await this._remove(this._ref(this.db, `landings/${ano}/${versionId}`));
    }

    // -------------------- VOLUMES --------------------

    async getVolume(ano, filialId, tipo /* 'budget'|'landing' */) {
        const snap = await this._get(this._ref(this.db, `volumes/${ano}/${filialId}/${tipo}`));
        return snap.exists() ? snap.val() : null;
    }

    async saveVolume(ano, filialId, tipo, data) {
        const payload = { ...data, ano, filialId, tipo, total: somaMeses(data), updatedAt: Date.now() };
        await this._update(this._ref(this.db), { [`volumes/${ano}/${filialId}/${tipo}`]: payload });
        return payload;
    }

    // -------------------- USUÁRIOS --------------------

    async getUsuarios(force = false) {
        if (this.cache.usuarios && !force) return this.cache.usuarios;
        const snap = await this._get(this._ref(this.db, 'usuarios'));
        this.cache.usuarios = snap.exists() ? snap.val() : {};
        return this.cache.usuarios;
    }

    async getUsuario(uid) {
        const snap = await this._get(this._ref(this.db, `usuarios/${uid}`));
        return snap.exists() ? snap.val() : null;
    }

    async saveUsuario(uid, data) {
        const payload = { ...data, id: uid, updatedAt: Date.now() };
        await this._update(this._ref(this.db), { [`usuarios/${uid}`]: payload });
        this.cache.usuarios = null;
        return payload;
    }

    async setUsuarioAtivo(uid, ativo) {
        await this._update(this._ref(this.db, `usuarios/${uid}`), { ativo });
        this.cache.usuarios = null;
    }

    // -------------------- PERFIS --------------------

    async getPerfis(force = false) {
        if (this.cache.perfis && !force) return this.cache.perfis;
        const snap = await this._get(this._ref(this.db, 'perfis'));
        this.cache.perfis = snap.exists() ? snap.val() : {};
        return this.cache.perfis;
    }

    async savePerfil(perfil) {
        if (!perfil.id) perfil.id = 'perfil_' + (perfil.nome || Date.now()).toString().toLowerCase().replace(/\s+/g, '_');
        const payload = { ...perfil, updatedAt: Date.now() };
        await this._update(this._ref(this.db), { [`perfis/${perfil.id}`]: payload });
        this.cache.perfis = null;
        return payload;
    }

    async deletePerfil(perfilId) {
        await this._remove(this._ref(this.db, `perfis/${perfilId}`));
        this.cache.perfis = null;
    }

    // -------------------- JUSTIFICATIVAS DE VARIAÇÃO --------------------

    async saveJustificativa(ano, filialId, ccId, linhaKey, texto) {
        await this._update(this._ref(this.db), {
            [`justificativas/${ano}/${filialId}/${ccId}/${linhaKey}`]: {
                texto,
                updatedAt: Date.now(),
            },
        });
    }

    async getJustificativasFilial(ano, filialId) {
        const snap = await this._get(this._ref(this.db, `justificativas/${ano}/${filialId}`));
        return snap.exists() ? snap.val() : {};
    }

    // -------------------- CACHE --------------------

    clearCache() {
        this.cache = { filiais: null, centrosCusto: {}, classesCusto: null, perfis: null, usuarios: null };
    }
}

export function somaMeses(obj) {
    return MESES.reduce((acc, m) => acc + (Number(obj?.[m]) || 0), 0);
}

export { MESES, MESES_NOMES };

// Singleton aguarda firebase pronto
const db = new Database();

if (window.firebase) {
    window.db = db;
} else {
    window.addEventListener('firebase:ready', () => { window.db = db; });
}

export default db;
