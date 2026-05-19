# Budgeter - Arquitetura de Dados (v2)

## Hierarquia

```
Filial (unidade operacional)
   └─ Centro de Custo
         └─ Classe de Custo (catálogo global)
               └─ Despesa (linha com Jan..Dez, Responsáveis, Observações)
```

Catálogos paralelos:
- **Perfis** — templates de permissão.
- **Usuários** — vinculam perfil + filiais autorizadas + (opcional) CCs específicos.
- **Landings** — snapshots versionados por ano (não sobrescrevem).
- **Volumes** — volume mensal (Budget e Landing) por filial/ano.
- **Justificativas** — texto livre por linha de Budget, usado no comparativo YoY.

## Caminhos no RTDB

```
config
perfis/{perfilId}
filiais/{filialId}
centrosCusto/{filialId}/{ccId}
classesCusto/{classeId}
budgets/{ano}/{filialId}/{ccId}/{classeId}/{despesaId}
landings/{ano}/{versionId}/{ ..., linhas: { {linhaId}: {...} } }
volumes/{ano}/{filialId}/{ tipo: 'budget'|'landing' }
justificativas/{ano}/{filialId}/{ccId}/{linhaId}
usuarios/{uid}
```

## Schemas (JSON)

### Filial

```json
{
  "id": "filial_demo",
  "codigo": "DEMO",
  "nome": "Filial Demo",
  "fimmo": "EXTCOD",
  "ativo": true,
  "ordem": 1,
  "updatedAt": 1700000000000
}
```

### Centro de Custo

```json
{
  "id": "CC001",
  "filialId": "filial_demo",
  "codigo": "CC001",
  "nome": "Operações",
  "budget": "Categoria A",
  "ativo": true,
  "ordem": 1
}
```

### Classe de Custo

```json
{
  "id": "CLS001",
  "codigo": "CLS001",
  "descricao": "Descrição da classe",
  "grupoGeral": "Production Overheads",
  "subGrupo": "Others Overheads"
}
```

### Despesa (linha de Budget)

```json
{
  "id": "despesa_abc",
  "filialId": "filial_demo",
  "ccId": "CC001",
  "classeId": "CLS001",
  "ano": 2026,
  "descricao": "Despesa exemplo",
  "responsaveis": "Equipe X",
  "observacoes": "Contrato anual",
  "jan": 1000, "fev": 1000, "...": "...", "dez": 1000,
  "total": 12000,
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000
}
```

### Landing (versão)

```json
{
  "id": "v1700000000000",
  "ano": 2025,
  "nome": "Landing fechamento 12/2025",
  "createdAt": 1700000000000,
  "createdBy": "admin@empresa.com",
  "totalLinhas": 320,
  "linhas": {
    "lnd_00001": { /* mesma forma que Despesa, sem o campo "ano" */ }
  }
}
```

### Usuário

```json
{
  "id": "<uid>",
  "email": "joao@empresa.com",
  "nome": "João",
  "role": "manager",
  "perfilId": "perfil_gestor_filial",
  "filiais": { "filial_demo": true },
  "ccIds":   { "CC001": true },
  "ativo": true,
  "createdAt": 1700000000000
}
```

`filiais` vazio + role `admin`/`financeiro` = acesso a todas.
`ccIds` vazio = acesso a todos os CCs das filiais autorizadas.

### Perfil

```json
{
  "id": "perfil_gestor_filial",
  "nome": "Gestor de Filial",
  "role": "manager",
  "permissoes": {
    "gerirUsuarios": false,
    "gerirEstrutura": false,
    "importarLanding": false,
    "editarBudget": true,
    "editarLanding": false,
    "editarVolume": true,
    "verRelatorios": true
  }
}
```

## Regras de segurança

Resumo (ver `database.rules.json`):

- Leitura: requer `auth != null` para a maioria das coleções.
- `usuarios/{uid}`: o próprio usuário lê, admin/financeiro leem todos; só admin escreve em terceiros.
- `perfis`: leitura para todos autenticados, escrita só para admin.
- `filiais`, `centrosCusto`, `classesCusto`, `landings`: escrita para admin/financeiro.
- `budgets/{ano}/{filialId}` e `volumes/{ano}/{filialId}`: leitura/escrita por admin/financeiro **OU** por usuários que tenham `filiais/{filialId}` no perfil (e não sejam viewer).
- `justificativas`: qualquer autenticado pode ler/escrever (escopo de filial controlado no cliente).

## Decisões de design

1. **Schema achatado por ano em `budgets/{ano}/...`** evita "carregar tudo" — cada filial carrega só seu subárvore.
2. **Classes de Custo no nível global** (não aninhadas por CC) porque o catálogo é compartilhado entre filiais e CCs.
3. **Landing versionado** permite comparar Budget proposto contra qualquer snapshot histórico, e nada é destruído.
4. **Despesa por CC/Classe/Id** facilita filtrar via tree (`budgets/{ano}/{filial}/{cc}/{classe}/...`).
5. **Volume separado** porque tem unidade própria (não é R$) e dimensionalidade diferente.

## Performance / Free tier

- O catálogo (filiais, CCs, classes, perfis, usuarios) é cacheado em memória até invalidação explícita.
- O editor faz `onValue` apenas no nó `budgets/{ano}/{filialId}` da filial selecionada.
- Importação de Landing usa um único `update()` multi-path para minimizar writes.
- RTDB no plano Spark: 100 conexões simultâneas, 1 GB armazenamento, 10 GB/mês de download — suficiente para times pequenos e médios.
