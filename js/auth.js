// Budgeter - Auth (v2)
// Suporta papéis admin / financeiro / manager / viewer e permissões por perfilId.

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.perfilData = null;
        this._ready = false;
    }

    init() {
        if (!window.firebase) {
            window.addEventListener('firebase:ready', () => this.init(), { once: true });
            return;
        }
        const fb = window.firebase;

        fb.onAuthStateChanged(fb.auth, async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserData(user.uid);
                this.showApp();
            } else {
                this.currentUser = null;
                this.userData = null;
                this.perfilData = null;
                this.showLogin();
            }
        });

        const loginForm = document.getElementById('login-form');
        if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');
        try {
            errorDiv.textContent = '';
            await window.firebase.signInWithEmailAndPassword(window.firebase.auth, email, password);
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = this.getErrorMessage(error.code);
        }
    }

    async handleLogout() {
        try {
            await window.firebase.signOut(window.firebase.auth);
        } catch (err) {
            console.error('Logout error:', err);
        }
    }

    async loadUserData(uid) {
        const fb = window.firebase;
        try {
            const snap = await fb.get(fb.ref(fb.db, `usuarios/${uid}`));
            if (snap.exists()) {
                this.userData = snap.val();
            } else {
                // Self-bootstrap como viewer; admin precisa promover depois
                this.userData = {
                    id: uid,
                    email: this.currentUser.email,
                    nome: this.currentUser.displayName || this.currentUser.email.split('@')[0],
                    role: 'viewer',
                    perfilId: null,
                    filiais: {},
                    ccIds: {},
                    ativo: true,
                    createdAt: Date.now(),
                };
                await fb.set(fb.ref(fb.db, `usuarios/${uid}`), this.userData);
            }
            // Carrega perfil associado (se houver)
            if (this.userData.perfilId) {
                const ps = await fb.get(fb.ref(fb.db, `perfis/${this.userData.perfilId}`));
                this.perfilData = ps.exists() ? ps.val() : null;
            }
        } catch (err) {
            console.error('Erro ao carregar usuário:', err);
            this.userData = null;
        }
    }

    showLogin() {
        document.getElementById('login-screen')?.classList.remove('hidden');
        document.getElementById('app')?.classList.add('hidden');
    }

    showApp() {
        document.getElementById('login-screen')?.classList.add('hidden');
        document.getElementById('app')?.classList.remove('hidden');

        // Mostra/oculta menu admin
        const adminLink = document.getElementById('nav-admin');
        if (adminLink) adminLink.classList.toggle('hidden', !this.isAdmin && !this.isFinanceiro);

        if (!this._ready) {
            this._ready = true;
            window.dispatchEvent(new CustomEvent('auth:ready', {
                detail: { user: this.currentUser, userData: this.userData, perfilData: this.perfilData },
            }));
        }
    }

    getErrorMessage(code) {
        const messages = {
            'auth/invalid-email': 'Email inválido',
            'auth/user-disabled': 'Usuário desativado',
            'auth/user-not-found': 'Usuário não encontrado',
            'auth/wrong-password': 'Senha incorreta',
            'auth/invalid-credential': 'Email ou senha incorretos',
            'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
            'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
        };
        return messages[code] || 'Erro ao fazer login. Tente novamente.';
    }

    // Helpers de permissão -------------------------------------------------
    get isAuthenticated() { return !!this.currentUser; }
    get isAdmin()         { return this.userData?.role === 'admin'; }
    get isFinanceiro()    { return this.userData?.role === 'financeiro' || this.isAdmin; }
    get isManager()       { return this.userData?.role === 'manager' || this.isFinanceiro; }
    get isViewer()        { return this.userData?.role === 'viewer'; }

    /** Filiais que o usuário acessa. Admin/financeiro veem todas. */
    get userFiliais() {
        if (this.isFinanceiro) return null; // sentinel = "todas"
        return Object.keys(this.userData?.filiais || {});
    }

    /** CCs que o usuário pode editar. null = sem restrição (todas as CCs da filial). */
    get userCcIds() {
        if (this.isFinanceiro) return null;
        const ids = Object.keys(this.userData?.ccIds || {});
        return ids.length ? ids : null;
    }

    hasAccessToFilial(filialId) {
        if (this.isFinanceiro) return true;
        return !!this.userData?.filiais?.[filialId];
    }

    canEditBudget()   { return !this.isViewer && (this.isManager || this.isFinanceiro); }
    canEditLanding()  { return this.isFinanceiro; }
    canImportLanding(){ return this.isFinanceiro; }
    canManageUsers()  { return this.isAdmin; }
    canManageStructure() { return this.isFinanceiro; }
    canEditVolume()   { return !this.isViewer && (this.isManager || this.isFinanceiro); }
}

const authManager = new AuthManager();
window.authManager = authManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => authManager.init());
} else {
    authManager.init();
}

export default authManager;
