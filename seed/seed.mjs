// Budgeter - Seed Script
// Popula RTDB (emulador) com dados iniciais e cria usuários admin/financeiro no Auth emulator
//
// Uso:
//   npm run dev          (em outro terminal, inicia os emuladores com import/export)
//   npm run seed         (carrega seed-data.json no RTDB e cria usuários demo)
//
// Requer Node 18+ (fetch nativo).

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT_ID = 'budgeter-app-44332';
const DB_EMULATOR = process.env.FIREBASE_DATABASE_EMULATOR_HOST || '127.0.0.1:9000';
const AUTH_EMULATOR = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

const DB_URL = `http://${DB_EMULATOR}/.json?ns=${PROJECT_ID}-default-rtdb`;
const AUTH_URL = `http://${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-key`;

const USERS_TO_CREATE = [
    {
        email: 'admin@budgeter.local',
        password: 'admin1234',
        displayName: 'Admin Local',
        nome: 'Admin Local',
        role: 'admin',
        perfilId: 'perfil_admin',
        filiais: { filial_santarem: true },
    },
    {
        email: 'financeiro@budgeter.local',
        password: 'finance1234',
        displayName: 'Financeiro Local',
        nome: 'Financeiro Local',
        role: 'financeiro',
        perfilId: 'perfil_financeiro',
        filiais: { filial_santarem: true },
    },
    {
        email: 'gestor@budgeter.local',
        password: 'gestor1234',
        displayName: 'Gestor Santarém',
        nome: 'Gestor Santarém',
        role: 'manager',
        perfilId: 'perfil_gestor_filial',
        filiais: { filial_santarem: true },
        ccIds: { '1569297': true, '1569312': true },
    },
];

async function checkEmulator() {
    try {
        const res = await fetch(`http://${DB_EMULATOR}/.json?ns=${PROJECT_ID}-default-rtdb`);
        if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
        console.error('❌ Emulador do RTDB não está rodando em', DB_EMULATOR);
        console.error('   Rode "npm run dev" em outro terminal antes de seedar.');
        process.exit(1);
    }
}

async function createAuthUser(user) {
    const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: user.email,
            password: user.password,
            displayName: user.displayName,
            returnSecureToken: true,
        }),
    });
    const body = await res.json();
    if (!res.ok) {
        if (body.error?.message === 'EMAIL_EXISTS') {
            console.log(`  · usuário já existe: ${user.email} (pulando criação no Auth)`);
            // Tenta buscar UID via REST do Auth emulator
            const lookup = await fetch(
                `http://${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/accounts`,
            );
            const lj = await lookup.json();
            const found = (lj.users || []).find((u) => u.email === user.email);
            return found?.localId;
        }
        throw new Error(`Falha ao criar ${user.email}: ${body.error?.message || res.status}`);
    }
    return body.localId;
}

async function writeDb(path, data) {
    const url = `http://${DB_EMULATOR}/${path}.json?ns=${PROJECT_ID}-default-rtdb`;
    const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`PUT ${path} falhou: ${res.status}`);
}

async function main() {
    console.log('🌱 Budgeter seed iniciando...');
    await checkEmulator();

    const seedPath = join(__dirname, 'seed-data.json');
    const seed = JSON.parse(await readFile(seedPath, 'utf-8'));

    console.log('📦 Escrevendo estrutura base no RTDB...');
    await writeDb('config', seed.config);
    await writeDb('perfis', seed.perfis);
    await writeDb('filiais', seed.filiais);
    await writeDb('centrosCusto', seed.centrosCusto);
    await writeDb('classesCusto', seed.classesCusto);
    await writeDb('landings', seed.landings);
    await writeDb('volumes', seed.volumes);

    console.log('👤 Criando usuários demo no Auth emulator...');
    const usuarios = {};
    for (const u of USERS_TO_CREATE) {
        const uid = await createAuthUser(u);
        if (!uid) {
            console.warn(`  ! não obtive UID de ${u.email}`);
            continue;
        }
        usuarios[uid] = {
            id: uid,
            email: u.email,
            nome: u.nome,
            role: u.role,
            perfilId: u.perfilId,
            filiais: u.filiais || {},
            ccIds: u.ccIds || {},
            ativo: true,
            createdAt: Date.now(),
        };
        console.log(`  ✓ ${u.email}  (uid=${uid}, role=${u.role})`);
    }
    await writeDb('usuarios', usuarios);

    console.log('\n✅ Seed concluído!');
    console.log('   App:        http://localhost:5000');
    console.log('   Emulator UI: http://localhost:4000');
    console.log('\n   Logins de teste:');
    for (const u of USERS_TO_CREATE) {
        console.log(`     ${u.email} / ${u.password}   (${u.role})`);
    }
}

main().catch((err) => {
    console.error('❌ Erro no seed:', err);
    process.exit(1);
});
