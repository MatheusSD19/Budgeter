// Budgeter - Firebase Init
// Centraliza inicialização do Firebase e conexão com emuladores em ambiente local

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
    getAuth,
    connectAuthEmulator,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import {
    getDatabase,
    connectDatabaseEmulator,
    ref,
    get,
    set,
    update,
    push,
    remove,
    onValue,
    off,
    query,
    orderByChild,
    limitToLast,
    serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

import { appConfig } from './config.js';

const app = initializeApp(appConfig.firebase);
const auth = getAuth(app);
const db = getDatabase(app);

if (appConfig.isLocal) {
    try {
        connectAuthEmulator(auth, appConfig.emulators.auth.url, { disableWarnings: true });
        connectDatabaseEmulator(db, appConfig.emulators.database.host, appConfig.emulators.database.port);
        console.info('[Budgeter] Conectado aos emuladores locais do Firebase.');
    } catch (err) {
        console.warn('[Budgeter] Falha ao conectar emuladores:', err);
    }
}

window.firebase = {
    app,
    auth,
    db,
    isLocal: appConfig.isLocal,
    // auth helpers
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    // database helpers
    ref,
    get,
    set,
    update,
    push,
    remove,
    onValue,
    off,
    query,
    orderByChild,
    limitToLast,
    serverTimestamp,
};

// Sinaliza prontidão para módulos que carregam depois
window.dispatchEvent(new CustomEvent('firebase:ready'));

export default window.firebase;
