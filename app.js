# Budgeter - Arquitetura de Dados

## Firebase Realtime Database

### Estrutura de Dados JSON

```json
{
  "unidades": {
    "unidade_001": {
      "id": "unidade_001",
      "nome": "Matriz São Paulo",
      "codigo": "MAT-SP",
      "ativo": true,
      "createdAt": 1715990400000,
      "updatedAt": 1715990400000,
      "totalOrcado": 1500000.00,
      "totalRealizado": 0.00,
      "responsavel": "user_001"
    }
  },
  
  "setores": {
    "unidade_001": {
      "setor_001": {
        "id": "setor_001",
        "unidadeId": "unidade_001",
        "nome": "Operações",
        "codigo": "OP",
        "ativo": true,
        "ordem": 1,
        "totalOrcado": 800000.00,
        "totalRealizado": 0.00,
        "responsavel": "user_002"
      },
      "setor_002": {
        "id": "setor_002",
        "unidadeId": "unidade_001",
        "nome": "Administrativo",
        "codigo": "ADM",
        "ativo": true,
        "ordem": 2,
        "totalOrcado": 400000.00,
        "totalRealizado": 0.00,
        "responsavel": "user_003"
      },
      "setor_003": {
        "id": "setor_003",
        "unidadeId": "unidade_001",
        "nome": "Comercial",
        "codigo": "COM",
        "ativo": true,
        "ordem": 3,
        "totalOrcado": 300000.00,
        "totalRealizado": 0.00,
        "responsavel": "user_004"
      }
    }
  },
  
  "centrosCusto": {
    "setor_001": {
      "cc_001": {
        "id": "cc_001",
        "setorId": "setor_001",
        "unidadeId": "unidade_001",
        "nome": "Combustível",
        "codigo": "CC-001",
        "descricao": "Abastecimento de frota",
        "ativo": true,
        "ordem": 1
      },
      "cc_002": {
        "id": "cc_002",
        "setorId": "setor_001",
        "unidadeId": "unidade_001",
        "nome": "Manutenção",
        "codigo": "CC-002",
        "descricao": "Manutenção preventiva e corretiva",
        "ativo": true,
        "ordem": 2
      },
      "cc_003": {
        "id": "cc_003",
        "setorId": "setor_001",
        "unidadeId": "unidade_001",
        "nome": "Tripulação",
        "codigo": "CC-003",
        "descricao": "Salários e benefícios",
        "ativo": true,
        "ordem": 3
      }
    }
  },
  
  "budgets": {
    "2024": {
      "unidade_001": {
        "setor_001": {
          "cc_001": {
            "linha_001": {
              "id": "linha_001",
              "ccId": "cc_001",
              "setorId": "setor_001",
              "unidadeId": "unidade_001",
              "ano": 2024,
              "descricao": "Gasolina - Frota leve",
              "jan": 15000.00,
              "fev": 15000.00,
              "mar": 15000.00,
              "abr": 15000.00,
              "mai": 15000.00,
              "jun": 15000.00,
              "jul": 15000.00,
              "ago": 15000.00,
              "set": 15000.00,
              "out": 15000.00,
              "nov": 15000.00,
              "dez": 15000.00,
              "total": 180000.00,
              "createdAt": 1715990400000,
              "updatedAt": 1715990400000,
              "createdBy": "user_002",
              "updatedBy": "user_002"
            },
            "cc_total": {
              "jan": 35000.00,
              "fev": 35000.00,
              "mar": 35000.00,
              "abr": 35000.00,
              "mai": 35000.00,
              "jun": 35000.00,
              "jul": 35000.00,
              "ago": 35000.00,
              "set": 35000.00,
              "out": 35000.00,
              "nov": 35000.00,
              "dez": 35000.00,
              "total": 420000.00
            }
          },
          "setor_total": {
            "jan": 66666.67,
            "fev": 66666.67,
            "mar": 66666.67,
            "abr": 66666.67,
            "mai": 66666.67,
            "jun": 66666.67,
            "jul": 66666.67,
            "ago": 66666.67,
            "set": 66666.67,
            "out": 66666.67,
            "nov": 66666.67,
            "dez": 66666.67,
            "total": 800000.00
          }
        },
        "unidade_total": {
          "jan": 125000.00,
          "fev": 125000.00,
          "mar": 125000.00,
          "abr": 125000.00,
          "mai": 125000.00,
          "jun": 125000.00,
          "jul": 125000.00,
          "ago": 125000.00,
          "set": 125000.00,
          "out": 125000.00,
          "nov": 125000.00,
          "dez": 125000.00,
          "total": 1500000.00
        }
      }
    }
  },
  
  "usuarios": {
    "user_001": {
      "id": "user_001",
      "nome": "João Silva",
      "email": "joao@empresa.com",
      "role": "admin",
      "unidades": ["unidade_001", "unidade_002"],
      "createdAt": 1715990400000
    }
  },
  
  "config": {
    "versao": "1.0.0",
    "anoAtual": 2024,
    "moeda": "BRL",
    "locale": "pt-BR"
  }
}
```

## Regras de Segurança

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    
    "unidades": {
      ".read": "auth != null",
      ".write": "root.child('usuarios').child(auth.uid).child('role').val() == 'admin'"
    },
    
    "setores": {
      "$unidadeId": {
        ".read": "auth != null",
        ".write": "root.child('usuarios').child(auth.uid).child('role').val() == 'admin' || 
                  root.child('usuarios').child(auth.uid).child('unidades').hasChild($unidadeId)"
      }
    },
    
    "centrosCusto": {
      "$setorId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    
    "budgets": {
      "$ano": {
        "$unidadeId": {
          ".read": "auth != null",
          ".write": "root.child('usuarios').child(auth.uid).child('role').val() == 'admin' || 
                    root.child('usuarios').child(auth.uid).child('unidades').hasChild($unidadeId)"
        }
      }
    },
    
    "usuarios": {
      "$uid": {
        ".read": "auth.uid == $uid || 
                  root.child('usuarios').child(auth.uid).child('role').val() == 'admin'",
        ".write": "auth.uid == $uid || 
                  root.child('usuarios').child(auth.uid).child('role').val() == 'admin'"
      }
    }
  }
}
```

## Estrutura de Arquivos do Projeto

```
Budgeter/
├──── index.html              # Entry point
├──── css/
│   ├──── main.css              # Variáveis e resets
│   ├──── components.css        # Cards, buttons, inputs
│   ├──── layout.css            # Grid, sidebar, header
│   └──── dark-theme.css        # Tema escuro (Linear-inspired)
├──── js/
│   ├──── app.js                # Inicialização Firebase
│   ├──── auth.js               # Autenticação
│   ├──── database.js           # CRUD operations
│   ├──── tree.js               # Componente de árvore
│   ├──── budget.js             # Lógica de budget
│   ├──── formatters.js         # Moeda, números, datas
│   └──── charts.js             # Visualizações (opcional)
├──── DESIGN.md               # Especificação visual
└──── docs/
    └──── ARQUITETURA.md        # Este arquivo
```

## Funcionalidades Principais

### 1. Navegação Hierárquica
- Sidebar com árvore expansível: Unidade → Setores → Centros de Custo
- Indicadores visuais de status (dentro/estourado)
- Breadcrumbs no header

### 2. Input de Budget
- Tabela mensal (Jan-Dez) por linha de budget
- Cálculo automático de totais
- Validação de valores
- Auto-save com debounce

### 3. Consolidação
- Totais automáticos por centro de custo
- Totais por setor (soma dos CCs)
- Totais por unidade (soma dos setores)
- Visão consolidada cross-unidades (para admins)

### 4. Visualizações
- Cards de métricas principais
- Gráfico de evolução mensal
- Comparativo orçado vs realizado (futuro)
- Indicadores de variação percentual

## Considerações Técnicas

### Performance
- Paginação: Carregar apenas o ano atual inicialmente
- Caching: Manter estrutura (unidades/setores/CCs) em memória
- Debounce: Salvar alterações apenas após 500ms de inatividade
- Virtualização: Para tabelas muito grandes (se necessário)

### Offline
- Firebase é offline-first por padrão
- Persistência local automática
- Sincronização quando online

### Segurança
- Regras de segurança no Firebase
- Autenticação por email/senha ou Google
- Roles: admin, manager, viewer
- Validar dados no cliente e servidor

## Próximos Passos

1. [ ] Criar estrutura base HTML/CSS
2. [ ] Configurar Firebase (auth + database)
3. [ ] Implementar navegação em árvore
4. [ ] Criar interface de input de budget
5. [ ] Implementar cálculos de consolidação
6. [ ] Adicionar visualizações
7. [ ] Testar com dados reais
8. [ ] Deploy no Firebase Hosting
