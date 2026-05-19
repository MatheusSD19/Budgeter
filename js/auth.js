// Budgeter - Auth
// Gerenciamento de autenticação com Firebase

class AuthManager {
    constructor() {
        this.auth = window.firebase.auth;
        this.onAuthStateChanged = window.firebase.onAuthStateChanged;
        this.signInWithEmailAndPassword = window.firebase.signInWithEmailAndPassword;
        this.signOut = window.firebase.signOut;
        
        this.currentUser = null;
        this.userData = null;
        
        this.init();
    }

    init() {
        // Escuta mudanças no estado de autenticação
        this.onAuthStateChanged(this.auth, async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserData(user.uid);
                this.showApp();
            } else {
                this.currentUser = null;
                this.userData = null;
                this.showLogin();
            }
        });

        // Setup formulário de login
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Setup botão de logout
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');

        try {
            errorDiv.textContent = '';
            await this.signInWithEmailAndPassword(this.auth, email, password);
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = this.getErrorMessage(error.code);
        }
    }

    async handleLogout() {
        try {
            await this.signOut(this.auth);
        } catch (error) {
            console.error('Logout error:', error);
            this.showToast('Erro ao sair', 'error');
        }
    }

    async loadUserData(uid) {
        try {
            const { db, ref, get } = window.firebase;
            const snapshot = await get(ref(db, `usuarios/${uid}`));
            
            if (snapshot.exists()) {
                this.userData = snapshot.val();
            } else {
                // Cria usuário básico se não existir
                this.userData = {
                    id: uid,
                    email: this.currentUser.email,
                    nome: this.currentUser.displayName || this.currentUser.email.split('@')[0],
                    role: 'viewer',
                    unidades: [],
                    createdAt: Date.now()
                };
                
                // Salva no banco
                const { set } = window.firebase;
                await set(ref(db, `usuarios/${uid}`), this.userData);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.userData = null;
        }
    }

    showLogin() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    }

    showApp() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        
        // Dispara evento para outros módulos saberem que o app está pronto
        window.dispatchEvent(new CustomEvent('auth:ready', { 
            detail: { user: this.currentUser, userData: this.userData }
        }));
    }

    getErrorMessage(code) {
        const messages = {
            'auth/invalid-email': 'Email inválido',
            'auth/user-disabled': 'Usuário desativado',
            'auth/user-not-found': 'Usuário não encontrado',
            'auth/wrong-password': 'Senha incorreta',
            'auth/invalid-credential': 'Email ou senha incorretos',
            'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
            'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.'
        };
        return messages[code] || 'Erro ao fazer login. Tente novamente.';
    }

    showToast(message, type = 'info') {
        window.dispatchEvent(new CustomEvent('app:toast', {
            detail: { message, type }
        }));
    }

    // Getters
    get isAuthenticated() {
        return !!this.currentUser;
    }

    get isAdmin() {
        return this.userData?.role === 'admin';
    }

    get isManager() {
        return this.userData?.role === 'manager' || this.isAdmin;
    }

    get userUnidades() {
        return this.userData?.unidades || [];
    }

    hasAccessToUnidade(unidadeId) {
        return this.isAdmin || this.userUnidades.includes(unidadeId);
    }
}

// Inicializa quando o DOM estiver pronto
let authManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        authManager = new AuthManager();
    });
} else {
    authManager = new AuthManager();
}

window.authManager = authManager;

export default AuthManager;
