## 📋 Sobre o Projeto

O **Gaudium Labs** é uma plataforma web de gestão de demandas internas desenvolvida em React + TypeScript. Ela centraliza solicitações entre departamentos (TI, RH, Marketing, Financeiro), permitindo que colaboradores criem chamados, gestores os gerenciem e a IA da Gaudium automatize a triagem — tudo em tempo real, com notificações e histórico de ações.

---

## 🤖 Features de Inteligência Artificial

### ✨ Triagem Automática com IA (n8n + LLM)

Ao criar uma nova demanda, o colaborador pode acionar o modo **"Ajuda da IA"**, que envia a descrição do chamado para um workflow de IA hospedado no [n8n](https://n8n.io). A IA analisa o contexto e retorna automaticamente:

| Campo | O que a IA faz |
|---|---|
| **Título** | Gera um título objetivo e formatado se o usuário não quiser escrever |
| **Setor Destino** | Identifica automaticamente o departamento correto (TI, RH, Marketing ou Financeiro) |
| **Prioridade** | Classifica o nível de urgência (Baixa, Média ou Alta) |
| **Justificativas** | Exibe cards com a explicação da decisão de setor e prioridade |

> Os campos sugeridos pela IA são totalmente editáveis antes do envio.

### 🔗 Webhooks de Eventos para Automação

Toda ação relevante no sistema dispara um webhook para o n8n, permitindo construir automações como notificações por e-mail, Slack, criação de tarefas no Jira, etc. Os eventos suportados são:

- **`demanda_criada`** — Disparado ao criar uma nova demanda
- **`status_alterado`** — Disparado ao mover uma demanda entre status (ex: Kanban drag-and-drop)
- **`responsavel_atribuido`** — Disparado ao atribuir ou remover responsáveis de uma demanda

O payload de cada evento inclui nomes reais dos usuários (não IDs) e metadados do departamento solicitante.

### 📡 Status de Conexão n8n

A sidebar exibe um indicador em tempo real do status de conexão com o n8n, garantindo visibilidade sobre se o pipeline de automações está ativo.

---

## 🚀 Funcionalidades Principais

### 📌 Gestão de Demandas

- **Criação de demandas** com título, descrição, setor destino, prioridade e prazo SLA
- **Dois modos de criação:** manual ou assistido por IA
- **Edição e exclusão** com controle de permissão por papel (criador, responsável, gestor/diretor)
- **Histórico de ações** em linha do tempo para cada demanda

### 📊 Visualizações

- **Quadro Kanban** com drag-and-drop (dnd-kit) — ideal para gestores
- **Tabela** com ordenação e filtragem — padrão para colaboradores
- **Gráfico de status** (Recharts) com visão geral das demandas do setor

### 🔎 Filtros e Busca

- Filtro por **prioridade** (Baixa, Média, Alta)
- Ordenação por **prazo SLA** (urgente primeiro ou longo prazo)
- Filtro por **responsável** (apenas gestores)
- **Busca textual** por título ou descrição em tempo real

### 🗂️ Visões por Papel

| Visão | Quem vê |
|---|---|
| **Minhas tarefas** | Demandas onde o usuário é responsável |
| **Minhas solicitações** | Demandas criadas pelo usuário |
| **Todas as tarefas** | Todas as demandas do departamento |
| **Pendentes** | Demandas sem responsável atribuído *(apenas gestores/diretores)* |

### 🔔 Central de Notificações

- Notificações em tempo real para criação de demandas, atribuição de responsáveis e mudanças de status
- Badge de contagem de não lidas na sidebar
- Opção de marcar como lida ou limpar todas

### 🎨 Interface

- Tema claro/escuro com persistência no `localStorage`
- Detecção automática da preferência do sistema (`prefers-color-scheme`)
- Design responsivo com Tailwind CSS v4 e animações com Motion

---

## ⚙️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript |
| Estilização | Tailwind CSS v4 |
| Drag & Drop | dnd-kit |
| Gráficos | Recharts |
| Animações | Motion (Framer Motion) |
| Datas | date-fns |
| IA & Automação | n8n (webhook) + LLM |
| SDK Gemini | @google/genai |
| Build | Vite 6 |

---

## 🛠️ Rodando Localmente

**Pré-requisitos:** Node.js 18+

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**

   Copie o arquivo de exemplo e preencha as chaves:
   ```bash
   cp .env.example .env.local
   ```

   | Variável | Descrição |
   |---|---|
   | `GEMINI_API_KEY` | Chave da API Gemini (Google AI Studio) |
   | `VITE_WEBHOOK_URL` | URL do webhook n8n para eventos de demandas |
   | `VITE_WEBHOOK_IA_URL` | URL do webhook n8n para triagem com IA |

3. **Rode a aplicação:**
   ```bash
   npm run dev
   ```

> **Obs:** Os webhooks n8n são opcionais. Sem eles, o sistema funciona normalmente — apenas as automações e a triagem por IA ficam desativadas.

---

## 👤 Usuários de Demonstração

O sistema já vem com 8 usuários mockados para teste:

| Nome | E-mail | Cargo | Departamento |
|---|---|---|---|
| Rian Vilanova | rian@gaudium.com | Estagiário de Automação e Inovação | TI |
| Dalton Malucelli | dalton@gaudium.com | Gestor de TI | TI |
| Maria Clara | mariaclara@gaudium.com | Recrutadora | RH |
| Marcos Dias | marcos@gaudium.com | Gestor de RH | RH |
| Amanda Rocha | amanda@gaudium.com | Analista de Marketing | Marketing |
| Bruno Muniz | bruno@gaudium.com | Diretor | Marketing |
| Camila Souza | camila@gaudium.com | Analista Financeiro | Financeiro |
| Diego Mendes | diego@gaudium.com | Gestor Financeiro | Financeiro |

---

## 🏗️ Estrutura do Projeto

```
src/
├── components/
│   ├── Dashboard.tsx          # Layout principal, filtros e navegação
│   ├── NovaDemandaModal.tsx   # Modal de criação com modo IA
│   ├── DemandaDetailSidebar.tsx # Detalhes, edição e histórico
│   ├── GestorBoard.tsx        # Quadro Kanban com drag-and-drop
│   ├── DemandasTable.tsx      # Visão em tabela
│   ├── StatusChart.tsx        # Gráfico de status
│   └── NotificacoesList.tsx   # Central de notificações
├── context/
│   ├── AuthContext.tsx        # Autenticação e usuário atual
│   └── DatabaseContext.tsx    # Estado global + webhooks
├── data.ts                    # Dados mockados
└── types.ts                   # Tipos TypeScript
```
