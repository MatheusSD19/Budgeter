# Budgeter

Sistema de gestão orçamentária empresarial multiusuário.
Estrutura: **Filial → Centro de Custo → Classe de Custo → Despesa**, com importação de Landing (CSV/Excel), versionamento, comparativos YoY, reajuste em massa e módulo de Volume.

100% hospedável no plano gratuito (Spark) do Firebase: usa apenas Authentication, Realtime Database e Hosting.

---

## Sumário

- [Stack](#stack)
- [Rodando localmente (emuladores)](#rodando-localmente-emuladores)
- [Login de teste](#login-de-teste)
- [Painel Admin](#painel-admin)
- [Importação de Landing (CSV/Excel)](#importação-de-landing-csvexcel)
- [Reajuste em massa & comparativo YoY](#reajuste-em-massa--comparativo-yoy)
- [Volume (Budget & Landing)](#volume-budget--landing)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Deploy em produção (Firebase Hosting)](#deploy-em-produção-firebase-hosting)

---

## Stack

- HTML5 + ES Modules (sem build step)
- Firebase Authentication (email/senha)
- Firebase Realtime Database
- Firebase Hosting
- SheetJS (carregado sob demanda no admin) para parse de XLSX

## Rodando localmente (emuladores)

Pré-requisitos: **Node.js 18+** e Java 11+ (necessário para os emuladores do Firebase).

```bash
# 1. Instalar firebase-tools localmente
npm install

# 2. Iniciar os emuladores (Auth + RTDB + Hosting + UI)
npm run dev

# 3. Em outro terminal, popular dados de exemplo + criar usuários demo
npm run seed
```

Endereços:
- App:        http://localhost:5000
- Admin:      http://localhost:5000/admin
- Emulator UI: http://localhost:4000

> O `js/config.js` detecta `localhost` e conecta automaticamente nos emuladores. Em produção, conecta no projeto real.

O comando `npm run dev` faz **import/export** do estado dos emuladores em `seed/export/` (gitignored), então seus dados de teste persistem entre execuções. Use `npm run dev:fresh` para começar do zero.

## Login de teste

O script `npm run seed` cria três usuários no Auth emulator:

| Email                       | Senha         | Papel       |
|----------------------------|---------------|-------------|
| admin@budgeter.local        | admin1234     | admin       |
| financeiro@budgeter.local   | finance1234   | financeiro  |
| gestor@budgeter.local       | gestor1234    | manager     |

## Painel Admin

Acesse via botão **Admin** no header (visível para `admin` e `financeiro`).

Inclui:

- **Usuários**: vincular UID já existente no Firebase Auth ou criar nova conta (em ambiente local). Definir papel, perfil, filiais com acesso e CCs específicos.
- **Perfis & Permissões**: templates de permissões reutilizáveis.
- **Filiais**: CRUD da entidade Filial (código, nome, FIMMO, ativo).
- **Centros de Custo**: CRUD por filial.
- **Classes de Custo**: catálogo global compartilhado entre filiais.
- **Importar Landing**: upload de CSV/XLSX (descrito abaixo).
- **Histórico de Landings**: navegar versões salvas, ver detalhes, aplicar como Budget de outro ano ou excluir.
- **Volume**: lançar Budget e Landing de volume por filial/ano.

### Papéis (roles)

| Role        | Pode                                                               |
|-------------|--------------------------------------------------------------------|
| admin       | tudo, inclusive gerir usuários                                     |
| financeiro  | gerir estrutura, importar Landing, editar Budget de qualquer filial|
| manager     | editar Budget e Volume das filiais e CCs atribuídos                |
| viewer      | apenas leitura                                                     |

## Importação de Landing (CSV/Excel)

Em **Admin → Importar Landing**.

Colunas reconhecidas no cabeçalho (insensível a maiúsculas e acentos):

- **Centro de Custo** *(obrigatório)*
- Budget (categoria livre, vira o campo `budget` no CC)
- Filial *(usa o "padrão" se omitida)*
- Fimmo *(código externo da filial)*
- **Classe de Custo** *(obrigatório)*
- Descrição Classe
- Grupo Geral
- Sub-Grupo
- **Descrição Despesa** *(obrigatório)*
- Janeiro, Fevereiro, ..., Dezembro *(números, com vírgula ou ponto decimal)*
- RESPONSÁVEIS
- OUTRAS OBSERVAÇÕES

Comportamento:
- **Auto-cadastro**: cria automaticamente Filiais, CCs e Classes que ainda não existem no banco.
- **Versionamento**: cada importação gera uma nova versão em `landings/{ano}/v{timestamp}` — nada é sobrescrito.
- **Aplicação opcional como Budget**: você pode escolher um ano de destino para já replicar como Budget editável.

Exemplo CSV mínimo (separador `;`):

```csv
Centro de Custo;Budget;Filial;Fimmo;Classe de Custo;Descrição Classe;Grupo Geral;Sub-Grupo;Descrição Despesa;Janeiro;Fevereiro;Março;Abril;Maio;Junho;Julho;Agosto;Setembro;Outubro;Novembro;Dezembro;RESPONSÁVEIS;OUTRAS OBSERVAÇÕES
CC001;Categoria A;Filial Demo;EXTCOD1;CLS001;Descrição classe;Grupo;Sub;Despesa exemplo;1000;1000;1000;1000;1000;1000;1000;1000;1000;1000;1000;1000;Responsável;Obs livre
```

## Reajuste em massa & comparativo YoY

No editor de Budget:

- **Reajuste %**: aplica um percentual (positivo ou negativo) em todas as linhas do filtro atual, em meses selecionáveis (padrão: todos). Modos: aumentar valores existentes ou copiar do último Landing e aplicar %.
- **Comparar YoY**: abre tabela com Landing do ano anterior vs Budget do ano corrente, variação em R$ e %, campo de **justificativa** salvo por linha (`justificativas/{ano}/{filial}/{cc}/{linha}`).

## Volume (Budget & Landing)

No painel Admin há uma aba para informar separadamente o **volume** mensal (ex.: toneladas, m³) por filial e ano, com duas tabelas: Budget e Landing.

## Estrutura de pastas

```
Budgeter/
├── index.html                # App principal (editor de Budget)
├── admin.html                # Painel administrativo
├── firebase.json             # Hosting + emulators
├── database.rules.json       # Regras do RTDB
├── package.json              # Scripts npm (dev, seed, deploy)
├── seed/
│   ├── seed-data.json        # Estrutura inicial (apenas perfis padrão)
│   └── seed.mjs              # Carregador via REST nos emuladores
├── css/                      # main, dark-theme, layout, components
└── js/
    ├── firebase-init.js      # Init + conexão com emuladores
    ├── config.js             # Detecção local vs prod
    ├── auth.js               # AuthManager (papel/perfil/filiais)
    ├── database.js           # CRUD do schema v2
    ├── tree.js               # Sidebar de navegação
    ├── budget.js             # Editor achatado (estilo planilha)
    ├── tools.js              # Reajuste + YoY
    ├── formatters.js
    └── admin/
        ├── admin.js          # Roteamento de tabs
        ├── usuarios.js       # CRUD usuários
        ├── perfis.js         # CRUD perfis
        ├── filiais.js        # CRUD filiais
        ├── ccs.js            # CRUD centros de custo
        ├── classes.js        # CRUD classes de custo
        ├── landing-import.js # Upload CSV/XLSX
        ├── landing-historico.js
        ├── volume.js
        └── utils.js
```

## Deploy em produção (Firebase Hosting)

```bash
# Pré-requisitos: projeto criado no Firebase, RTDB ativo, Auth com email/senha
firebase login
firebase use --add   # selecione seu projeto

# Atualiza regras + hosting
npm run deploy

# Só regras
npm run deploy:rules
```

Antes do primeiro deploy, ajuste `js/config.js` se quiser usar outro projeto (apiKey/databaseURL). A configuração atual aponta para o projeto `budgeter-app-44332`.

### Primeiro admin em produção

1. Cadastre o admin pelo Console do Firebase (Authentication → Add user).
2. No RTDB (aba Data), crie manualmente o nó `usuarios/{UID}` com:

```json
{
  "id": "{UID}", "email": "admin@empresa.com", "nome": "Admin",
  "role": "admin", "ativo": true, "createdAt": 1700000000000
}
```

3. Faça login pela aplicação e use o painel Admin para criar perfis, filiais, CCs, classes e demais usuários.

---

## Roadmap

- [ ] Cloud Function callable (Spark plan) para criar/desativar usuários sem usar Console
- [ ] Dashboards com gráficos (linha/coluna por mês)
- [ ] Export do Budget para Excel
- [ ] Realizado (lançamentos contábeis) vs Budget
- [ ] Aprovação por workflow (gestor → financeiro → admin)
- [ ] Multi-empresa (acima de Filial)

## Licença

MIT
