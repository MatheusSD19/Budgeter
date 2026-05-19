# Budgeter

Sistema de gestão orçamentária empresarial com hierarquia Unidade → Setores → Centros de Custo.

## Funcionalidades

- 🏢 **Múltiplas Unidades**: Gerencie budgets de várias unidades/empresas
- 📁 **Hierarquia Completa**: Unidade → Setores → Centros de Custo → Linhas de Budget
- 📊 **Visualização em Tempo Real**: Cards de métricas com totais automáticos
- 🔄 **Sincronização**: Dados sincronizados em tempo real entre usuários
- 🌑 **Dark Mode**: Interface escrita otimizada para longas sessões de trabalho
- 📱 **Responsivo**: Funciona em desktop e mobile

## Tecnologias

- HTML5, CSS3, JavaScript (ES6+)
- Firebase Authentication
- Firebase Realtime Database
- Firebase Hosting

## Configuração do Firebase

### 1. Criar Projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em "Criar projeto"
3. Dê um nome (ex: `budgeter-app`)
4. Desative Google Analytics (ou ative, se preferir)
5. Clique em "Criar projeto"

### 2. Ativar Authentication

1. No menu lateral, clique em "Authentication"
2. Clique em "Começar"
3. Ative "Email/Password" (habilite "Email/Password" e salve)
4. Vá em "Users" e clique em "Add user" para criar o primeiro usuário admin

### 3. Criar Realtime Database

1. No menu lateral, clique em "Realtime Database"
2. Clique em "Criar banco de dados"
3. Escolha a região mais próxima (ex: `us-central1`)
4. No modo de segurança, selecione "Modo bloqueado" (depois atualizaremos as regras)
5. Clique em "Ativar"

### 4. Configurar Regras de Segurança

1. Na aba "Regras" do Realtime Database
2. Substitua o conteúdo pelas regras do arquivo `docs/ARQUITETURA.md`
3. Clique em "Publicar"

### 5. Obter Configuração do App

1. Vá em "Configurações do projeto" (engrenagem ≡)
2. Na aba "Geral", role até "Seus aplicativos"
3. Clique no ícone `</>` para adicionar um app web
4. Dê um apelido (ex: `budgeter-web`)
5. Clique em "Registrar app"
6. Copie o objeto `firebaseConfig`
7. Cole no arquivo `index.html`, substituindo o objeto vazio em `firebaseConfig`

Exemplo:
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyB...",
    authDomain: "budgeter-app.firebaseapp.com",
    databaseURL: "https://budgeter-app-default-rtdb.firebaseio.com",
    projectId: "budgeter-app",
    storageBucket: "budgeter-app.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

### 6. Instalar Firebase CLI (para deploy)

```bash
# Instale o Node.js primeiro: https://nodejs.org

# Instale o Firebase CLI globalmente
npm install -g firebase-tools

# Faça login
firebase login

# Inicialize o projeto na pasta do Budgeter
cd Budgeter
firebase init hosting

# Selecione:
# - "Use an existing project" → escolha seu projeto
# - "What do you want to use as your public directory?" → digite: . (ponto)
# - "Configure as a single-page app?" → digite: N
# - "Set up automatic builds and deploys with GitHub?" → digite: N
```

### 7. Fazer Deploy

```bash
# Na pasta Budgeter
firebase deploy

# O terminal mostrará a URL de acesso, ex:
# ✔  Deploy complete!
# Project Console: https://console.firebase.google.com/project/budgeter-app/overview
# Hosting URL: https://budgeter-app.web.app
```

## Estrutura de Arquivos

```
Budgeter/
├──── index.html              # Entry point
├──── css/
│   ├──── main.css              # Variáveis e resets
│   ├──── components.css        # Cards, buttons, inputs
│   ├──── layout.css            # Grid, sidebar, header
│   └──── dark-theme.css        # Tema escuro Linear-inspired
├──── js/
│   ├──── app.js                # Inicialização do app
│   ├──── auth.js               # Autenticação
│   ├──── database.js           # CRUD Firebase
│   ├──── tree.js               # Componente de árvore
│   ├──── budget.js             # Lógica do editor
│   └──── formatters.js         # Moeda, números, datas
├──── DESIGN.md               # Especificação visual
├──── README.md               # Este arquivo
└──── docs/
    └──── ARQUITETURA.md        # Arquitetura de dados
```

## Dados Iniciais (Seed)

Para popular o banco com dados de exemplo, use o Firebase Console ou o Firebase CLI:

```bash
firebase database:set / seed.json
```

Crie um arquivo `seed.json` com a estrutura documentada em `docs/ARQUITETURA.md`.

## Roles de Usuário

- **admin**: Acesso total a todas as unidades e configurações
- **manager**: Acesso às unidades vinculadas, pode editar budgets
- **viewer**: Apenas visualização

Para definir o role de um usuário, edite diretamente no Realtime Database:

```json
{
  "usuarios": {
    "UID_DO_USUARIO": {
      "id": "UID_DO_USUARIO",
      "nome": "Nome do Usuário",
      "email": "email@exemplo.com",
      "role": "admin",
      "unidades": ["unidade_001", "unidade_002"]
    }
  }
}
```

## Personalização

### Alterar Ano Base

Edite `js/budget.js`, método `constructor`:

```javascript
this.state = {
    ano: 2025, // Altere aqui
    // ...
};
```

### Adicionar Campos ao Budget

1. Atualize a tabela em `index.html`
2. Atualize os métodos em `js/budget.js`:
   - `createLinhaRow()` - renderização
   - `saveLinha()` - salvamento
   - `updateTotais()` - cálculos

### Alterar Cores

Edite as variáveis CSS em `css/main.css`:

```css
:root {
    --brand-primary: #sua-cor;      /* Cor primária */
    --brand-accent: #sua-cor;       /* Cor de destaque */
    --status-positive: #sua-cor;    /* Cor de sucesso */
    --status-negative: #sua-cor;    /* Cor de erro */
}
```

## Roadmap

- [ ] Importação de budgets via Excel/CSV
- [ ] Exportação de relatórios PDF
- [ ] Gráficos e dashboards avançados
- [ ] Orçamento realizado vs orçado
- [ ] Alertas de budget estourado
- [ ] Comentários em linhas de budget
- [ ] Histórico de alterações

## Licença

MIT - Livre para uso comercial e modificação.

---

**Design inspirado no Linear.app** - Ultra-minimal dark mode
