// Budgeter - Config
// Detecta ambiente (local vs produção) e expõe configuração apropriada

const host = typeof location !== 'undefined' ? location.hostname : '';
const isLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.endsWith('.local');

export const appConfig = {
    isLocal,
    appVersion: '2.0.0',
    firebase: {
        apiKey: 'AIzaSyC8Y4C0wI4mghSsxceK3Yt1jp5Y_ZJ4cgY',
        authDomain: 'budgeter-app-44332.firebaseapp.com',
        databaseURL: 'https://budgeter-app-44332-default-rtdb.firebaseio.com',
        projectId: 'budgeter-app-44332',
        storageBucket: 'budgeter-app-44332.firebasestorage.app',
        messagingSenderId: '837923059163',
        appId: '1:837923059163:web:312baa847456d6e657e3fe',
    },
    emulators: {
        auth: { host: '127.0.0.1', port: 9099, url: 'http://127.0.0.1:9099' },
        database: { host: '127.0.0.1', port: 9000 },
    },
    // Convenção local: criar este usuário no Auth emulator para ter acesso admin
    bootstrap: {
        adminEmail: 'admin@budgeter.local',
        adminPassword: 'admin1234',
        financeiroEmail: 'financeiro@budgeter.local',
        financeiroPassword: 'finance1234',
    },
};

if (typeof window !== 'undefined') {
    window.appConfig = appConfig;
}
