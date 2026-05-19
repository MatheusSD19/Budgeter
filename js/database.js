// Budgeter - Database
// Operações CRUD com Firebase Realtime Database

class Database {
    constructor() {
        this.db = window.firebase.db;
        this.ref = window.firebase.ref;
        this.get = window.firebase.get;
        this.set = window.firebase.set;
        this.update = window.firebase.update;
        this.onValue = window.firebase.onValue;
        this.off = window.firebase.off;
        
        this.cache = {
            unidades: null,
            setores: {},
            centrosCusto: {},
            budgets: {}
        };
        
        this.listeners = {};
    }

    // ===== UNIDADES =====
    
    async getUnidades() {
        if (this.cache.unidades) {
            return this.cache.unidades;
        }
        
        const snapshot = await this.get(this.ref(this.db, 'unidades'));
        const unidades = snapshot.exists() ? snapshot.val() : {};
        this.cache.unidades = unidades;
        return unidades;
    }

    async getUnidade(id) {
        const unidades = await this.getUnidades();
        return unidades[id];
    }

    async saveUnidade(id, data) {
        const updates = {
            [`unidades/${id}`]: {
                ...data,
                id,
                updatedAt: Date.now()
            }
        };
        await this.update(this.ref(this.db), updates);
        this.cache.unidades = null; // Invalida cache
    }

    // ===== SETORES =====
    
    async getSetores(unidadeId) {
        if (this.cache.setores[unidadeId]) {
            return this.cache.setores[unidadeId];
        }
        
        const snapshot = await this.get(this.ref(this.db, `setores/${unidadeId}`));
        const setores = snapshot.exists() ? snapshot.val() : {};
        this.cache.setores[unidadeId] = setores;
        return setores;
    }

    async getSetor(unidadeId, setorId) {
        const setores = await this.getSetores(unidadeId);
        return setores[setorId];
    }

    async saveSetor(unidadeId, setorId, data) {
        const updates = {
            [`setores/${unidadeId}/${setorId}`]: {
                ...data,
                id: setorId,
                unidadeId,
                updatedAt: Date.now()
            }
        };
        await this.update(this.ref(this.db), updates);
        this.cache.setores[unidadeId] = null;
    }

    // ===== CENTROS DE CUSTO =====
    
    async getCentrosCusto(setorId) {
        if (this.cache.centrosCusto[setorId]) {
            return this.cache.centrosCusto[setorId];
        }
        
        const snapshot = await this.get(this.ref(this.db, `centrosCusto/${setorId}`));
        const centros = snapshot.exists() ? snapshot.val() : {};
        this.cache.centrosCusto[setorId] = centros;
        return centros;
    }

    async getCentroCusto(setorId, ccId) {
        const centros = await this.getCentrosCusto(setorId);
        return centros[ccId];
    }

    async saveCentroCusto(setorId, ccId, data) {
        const updates = {
            [`centrosCusto/${setorId}/${ccId}`]: {
                ...data,
                id: ccId,
                setorId,
                updatedAt: Date.now()
            }
        };
        await this.update(this.ref(this.db), updates);
        this.cache.centrosCusto[setorId] = null;
    }

    // ===== BUDGETS =====
    
    async getBudget(ano, unidadeId, setorId, ccId) {
        const cacheKey = `${ano}_${unidadeId}_${setorId}_${ccId}`;
        
        const snapshot = await this.get(
            this.ref(this.db, `budgets/${ano}/${unidadeId}/${setorId}/${ccId}`)
        );
        
        return snapshot.exists() ? snapshot.val() : {};
    }

    async getBudgetComTotais(ano, unidadeId, setorId, ccId) {
        const budget = await this.getBudget(ano, unidadeId, setorId, ccId);
        
        // Filtra apenas as linhas (exclui o nó cc_total)
        const linhas = {};
        let totalCC = { jan: 0, fev: 0, mar: 0, abr: 0, mai: 0, jun: 0, 
                        jul: 0, ago: 0, set: 0, out: 0, nov: 0, dez: 0, total: 0 };
        
        for (const [key, value] of Object.entries(budget)) {
            if (key === 'cc_total') continue;
            
            linhas[key] = value;
            
            // Soma para totais
            const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                          'jul', 'ago', 'set', 'out', 'nov', 'dez'];
            meses.forEach(mes => {
                totalCC[mes] += value[mes] || 0;
            });
            totalCC.total += value.total || 0;
        }
        
        return { linhas, totalCC };
    }

    async saveLinhaBudget(ano, unidadeId, setorId, ccId, linhaId, data) {
        const updates = {
            [`budgets/${ano}/${unidadeId}/${setorId}/${ccId}/${linhaId}`]: {
                ...data,
                id: linhaId,
                ano,
                ccId,
                setorId,
                unidadeId,
                updatedAt: Date.now()
            }
        };
        await this.update(this.ref(this.db), updates);
    }

    async deleteLinhaBudget(ano, unidadeId, setorId, ccId, linhaId) {
        await this.set(
            this.ref(this.db, `budgets/${ano}/${unidadeId}/${setorId}/${ccId}/${linhaId}`),
            null
        );
    }

    // ===== CONSOLIDAÇÃO =====
    
    async getConsolidacaoUnidade(ano, unidadeId) {
        const snapshot = await this.get(
            this.ref(this.db, `budgets/${ano}/${unidadeId}/unidade_total`)
        );
        return snapshot.exists() ? snapshot.val() : null;
    }

    async getConsolidacaoSetor(ano, unidadeId, setorId) {
        const snapshot = await this.get(
            this.ref(this.db, `budgets/${ano}/${unidadeId}/${setorId}/setor_total`)
        );
        return snapshot.exists() ? snapshot.val() : null;
    }

    async calcularConsolidacaoCC(ano, unidadeId, setorId, ccId) {
        const { linhas } = await this.getBudgetComTotais(ano, unidadeId, setorId, ccId);
        
        const total = { jan: 0, fev: 0, mar: 0, abr: 0, mai: 0, jun: 0, 
                       jul: 0, ago: 0, set: 0, out: 0, nov: 0, dez: 0, total: 0 };
        
        Object.values(linhas).forEach(linha => {
            const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                          'jul', 'ago', 'set', 'out', 'nov', 'dez'];
            meses.forEach(mes => {
                total[mes] += linha[mes] || 0;
            });
            total.total += linha.total || 0;
        });
        
        return total;
    }

    // ===== REALTIME LISTENERS =====
    
    onBudgetChange(ano, unidadeId, setorId, ccId, callback) {
        const path = `budgets/${ano}/${unidadeId}/${setorId}/${ccId}`;
        
        // Remove listener anterior se existir
        if (this.listeners[path]) {
            this.off(this.ref(this.db, path), 'value', this.listeners[path]);
        }
        
        // Cria novo listener
        const listener = this.onValue(
            this.ref(this.db, path),
            (snapshot) => {
                const data = snapshot.exists() ? snapshot.val() : {};
                callback(data);
            },
            (error) => {
                console.error('Database listener error:', error);
            }
        );
        
        this.listeners[path] = listener;
        return listener;
    }

    offBudgetChange(ano, unidadeId, setorId, ccId) {
        const path = `budgets/${ano}/${unidadeId}/${setorId}/${ccId}`;
        if (this.listeners[path]) {
            this.off(this.ref(this.db, path), 'value', this.listeners[path]);
            delete this.listeners[path];
        }
    }

    // ===== CACHE MANAGEMENT =====
    
    clearCache() {
        this.cache = {
            unidades: null,
            setores: {},
            centrosCusto: {},
            budgets: {}
        };
    }

    clearUnidadeCache(unidadeId) {
        delete this.cache.setores[unidadeId];
    }

    clearSetorCache(setorId) {
        delete this.cache.centrosCusto[setorId];
    }
}

// Singleton
const db = new Database();
window.db = db;

export default db;
