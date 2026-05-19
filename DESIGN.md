---
version: alpha
name: Budgeter
description: Dark-mode-first budget management app for multi-department enterprises. Precision engineering for financial data hierarchy.
colors:
  # Background Surfaces (Linear-inspired dark hierarchy)
  bg_marketing: "#08090a"
  bg_panel: "#0f1011"
  bg_surface: "#191a1b"
  bg_elevated: "#23252a"
  
  # Text Colors
  text_primary: "#f7f8f8"
  text_secondary: "#d0d6e0"
  text_tertiary: "#8a8f98"
  text_quaternary: "#62666d"
  
  # Brand & Accent (Adaptado para financeiro - azul profissional)
  brand_primary: "#3b82f6"
  brand_accent: "#60a5fa"
  brand_hover: "#93c5fd"
  
  # Financial Status Colors
  status_positive: "#10b981"
  status_warning: "#f59e0b"
  status_negative: "#ef4444"
  status_info: "#3b82f6"
  
  # Borders
  border_subtle: "rgba(255,255,255,0.05)"
  border_standard: "rgba(255,255,255,0.08)"
  border_prominent: "rgba(255,255,255,0.12)"

typography:
  # Display
  display_xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.00
    letterSpacing: "-1.056px"
  
  display_large:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.10
    letterSpacing: "-0.792px"
  
  # Headings
  h1:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.20
    letterSpacing: "-0.56px"
  
  h2:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.30
    letterSpacing: "-0.33px"
  
  h3:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.40
    letterSpacing: "-0.18px"
  
  # Body
  body_large:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.60
    letterSpacing: "0"
  
  body:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: "0"
  
  body_medium:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.50
    letterSpacing: "0"
  
  # Labels & Data
  label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.40
    letterSpacing: "0.02em"
  
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.40
    letterSpacing: "0.02em"
  
  # Monospace (para valores monetários)
  mono:
    fontFamily: "JetBrains Mono"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: "0"
  
  mono_large:
    fontFamily: "JetBrains Mono"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.40
    letterSpacing: "-0.36px"

rounded:
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px

components:
  # Buttons
  button_primary:
    backgroundColor: "{colors.brand_primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    typography: "{typography.body_medium}"
  
  button_primary_hover:
    backgroundColor: "{colors.brand_hover}"
  
  button_secondary:
    backgroundColor: "rgba(255,255,255,0.05)"
    textColor: "{colors.text_secondary}"
    border: "1px solid {colors.border_standard}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    typography: "{typography.body_medium}"
  
  button_ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text_tertiary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    typography: "{typography.body}"
  
  # Cards
  card:
    backgroundColor: "rgba(255,255,255,0.02)"
    border: "1px solid {colors.border_standard}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  
  card_elevated:
    backgroundColor: "{colors.bg_surface}"
    border: "1px solid {colors.border_prominent}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  
  # Inputs
  input:
    backgroundColor: "rgba(255,255,255,0.02)"
    textColor: "{colors.text_primary}"
    border: "1px solid {colors.border_standard}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
    typography: "{typography.body}"
  
  input_focus:
    border: "1px solid {colors.brand_accent}"
  
  # Data Display
  metric_value:
    typography: "{typography.mono_large}"
    textColor: "{colors.text_primary}"
  
  metric_label:
    typography: "{typography.label}"
    textColor: "{colors.text_tertiary}"
  
  # Hierarchy Items
  tree_item:
    backgroundColor: "transparent"
    border: "1px solid transparent"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  
  tree_item_hover:
    backgroundColor: "rgba(255,255,255,0.03)"
  
  tree_item_selected:
    backgroundColor: "rgba(59,130,246,0.10)"
    border: "1px solid rgba(59,130,246,0.30)"
  
  # Status Badges
  badge_positive:
    backgroundColor: "rgba(16,185,129,0.15)"
    textColor: "{colors.status_positive}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
    typography: "{typography.caption}"
  
  badge_warning:
    backgroundColor: "rgba(245,158,11,0.15)"
    textColor: "{colors.status_warning}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
    typography: "{typography.caption}"
  
  badge_negative:
    backgroundColor: "rgba(239,68,68,0.15)"
    textColor: "{colors.status_negative}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
    typography: "{typography.caption}"
---

## Overview

Budgeter é um aplicativo de gestão orçamentária empresarial com foco em hierarquia de dados e eficiência visual. O design segue uma filosofia "dark-mode-native" onde a interface escura reduz fadiga visual durante longas sessões de trabalho com planilhas e números.

A identidade visual comunica:
- **Precisão:** Tipografia monoespaçada para valores, alinhamento rigoroso
- **Hierarquia Clara:** Navegação em árvore visualmente distinta
- **Status Imediato:** Cores semânticas para variações orçamentárias
- **Profissionalismo:** Paleta sóbria com acentos azul corporativo

## Colors

### Superfícies
- **bg_marketing (#08090a):** Fundo mais profundo — canvas principal
- **bg_panel (#0f1011):** Painéis laterais, navegação
- **bg_surface (#191a1b):** Cards elevados, dropdowns, modais
- **bg_elevated (#23252a):** Elementos em destaque, hover states

### Texto
- **text_primary (#f7f8f8):** Texto principal — quase branco
- **text_secondary (#d0d6e0):** Corpo de texto, descrições
- **text_tertiary (#8a8f98):** Placeholders, metadados
- **text_quaternary (#62666d):** Timestamps, desabilitados

### Brand (Azul Corporativo)
- **brand_primary (#3b82f6):** CTAs primários, marca
- **brand_accent (#60a5fa):** Elementos interativos, seleção
- **brand_hover (#93c5fd):** Estados hover

### Status Financeiro
- **status_positive (#10b981):** Dentro do orçamento, superávit
- **status_warning (#f59e0b):** Atenção, próximo do limite
- **status_negative (#ef4444):** Estourado, deficit
- **status_info (#3b82f6):** Informação, projeções

### Bordas
- **border_subtle (rgba 5%):** Divisões mais leves
- **border_standard (rgba 8%):** Borda padrão de cards
- **border_prominent (rgba 12%):** Destaque, elementos selecionados

## Typography

### Princípios
- **Inter** para todo texto de interface — legível em tamanhos pequenos
- **JetBrains Mono** para valores monetários — alinhamento vertical consistente
- **Peso 500-600** para ênfase — nunca usar bold (700)
- **Tracking negativo** em headlines grandes (-0.56px a -1.056px)

### Hierarquia de Dados
1. **Valores Monetários:** JetBrains Mono 18px weight 500 — destaque máximo
2. **Títulos de Seção:** Inter 22px weight 500 — organização visual
3. **Labels de Campo:** Inter 12px weight 500 uppercase tracking — escaneabilidade
4. **Metadados:** Inter 11px weight 500 — contexto secundário

## Components

### Árvore de Hierarquia (Elemento Central)
A navegação principal exibe a estrutura Unidade → Setores → Centros de Custo como uma árvore expansível:

- **Indentação visual:** 24px por nível
- **Ícones de estado:** Chevron para expandir/colapsar
- **Status inline:** Badge de cor ao lado do nome quando houver alerta
- **Seleção:** Background azul translúcido com borda sutil

### Cards de Métricas
Exibição de totais consolidados:
- **Valor principal:** Mono 18px alinhado à direita
- **Label:** Inter 12px uppercase, cor terciária
- **Variação:** Badge colorido com percentual
- **Tendência:** Mini sparkline (opcional)

### Inputs de Budget
Campos para entrada de valores:
- **Prefixo:** R$ fixo à esquerda, cor terciária
- **Valor:** Alinhado à direita, mono
- **Estados:** Default → Focus (borda azul) → Filled (background sutil)

### Tabela de Consolidação
Visualização tabular do budget:
- **Header:** Inter 12px uppercase, border inferior
- **Rows:** Hover sutil, zebra striping opcional
- **Totais:** Background elevado, fonte em destaque
- **Sticky header:** Header fixo em scroll

## Layout

### Estrutura de Página
```
┌─────────────────────────────────────────────────────┐
│ HEADER (logo, unidade atual, usuário)               │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ SIDEBAR  │  MAIN CONTENT                            │
│ (árvore  │  ┌─────────────┬───────────────────────┐ │
│  de      │  │ Métricas    │ Visualizações         │ │
│  navega- │  │ Cards       │ (gráficos/tabelas)    │ │
│  ção)    │  └─────────────┴───────────────────────┘ │
│          │                                          │
│          │  ┌─────────────────────────────────────┐ │
│          │  │ Editor de Budget                    │ │
│          │  │ (forms/tabela de input)             │ │
│          │  └─────────────────────────────────────┘ │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

- **Sidebar:** 280px fixo, scroll independente
- **Main:** Fluido, max-width 1400px, padding 24px
- **Grid interno:** 12 colunas, gap 16px

### Responsividade
- **Desktop (>1024px):** Layout completo com sidebar
- **Tablet (768-1024px):** Sidebar colapsável, métricas em 2 colunas
- **Mobile (<768px):** Sidebar como drawer, layout single column

## Elevation & Depth

| Nível | Tratamento | Uso |
|-------|------------|-----|
| Flat | bg_marketing | Fundo da página |
| Subtle | bg_panel | Sidebar, navegação |
| Surface | bg_surface + border | Cards, modais |
| Elevated | bg_elevated + prominent border | Cards em destaque, totais |
| Overlay | rgba(0,0,0,0.85) | Backdrop de modais |

## Do's and Don'ts

### Do
- Usar JetBrains Mono para todo valor monetário
- Manter alinhamento à direita em colunas numéricas
- Usar cores de status apenas para indicar condição (não decoração)
- Aplicar tracking negativo em títulos grandes
- Usar bordas semi-transparentes (nunca sólidas escuras)
- Manter contraste mínimo 4.5:1 para acessibilidade

### Don't
- Nunca usar pure white (#fff) — text_primary (#f7f8f8) é o máximo
- Não misturar mais de uma cor de destaque (azul é suficiente)
- Evitar sombras em dark mode — usar elevação via luminância
- Não usar bold (700) — máximo 600
- Nunca alinhar valores monetários à esquerda

## Agent Prompt Guide

### Exemplo: Card de Métrica
"Create a metric card on bg_surface background. Header label at 12px Inter weight 500 uppercase, color text_tertiary, letter-spacing 0.02em. Value at 18px JetBrains Mono weight 500, color text_primary, aligned right. Add a positive badge with 10b981 background at 15% opacity, text same color, rounded full, 4px 10px padding."

### Exemplo: Item de Árvore
"Design a tree navigation item with 24px left padding per depth level. Use Inter 14px weight 400 for label, color text_secondary. Chevron icon 16px, color text_quaternary, rotated 90° when expanded. On hover: background rgba(255,255,255,0.03). When selected: background rgba(59,130,246,0.10), border 1px solid rgba(59,130,246,0.30), rounded 6px."

### Exemplo: Input de Valor
"Create a currency input with R$ prefix at left in text_tertiary, 14px. Input field with mono font, text_primary, aligned right. Background rgba(255,255,255,0.02), border 1px solid rgba(255,255,255,0.08), rounded 6px, padding 10px 12px. On focus: border transitions to brand_accent."
