import React, { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useDatabase } from "../context/DatabaseContext";
import { LogOut, Columns, List, CheckSquare, Layers, Plus, Send, SlidersHorizontal, Inbox, Sun, Moon, Search, Bell } from "lucide-react";
import { DemandasTable } from "./DemandasTable";
import { GestorBoard } from "./GestorBoard";
import { DemandaDetailSidebar } from "./DemandaDetailSidebar";
import { NovaDemandaModal } from "./NovaDemandaModal";
import { GaudiumLogo } from "./GaudiumLogo";
import { StatusChart } from "./StatusChart";
import { NotificacoesList } from "./NotificacoesList";
import { MOCK_USERS } from "../data";

type Tab = "Minhas tarefas" | "Minhas solicitações" | "Todas as tarefas" | "Pendentes" | "Notificações";
type ViewMode = "kanban" | "table";

export function Dashboard() {
  const { currentUser, logout } = useAuth();
  const { demandas, notificacoes } = useDatabase();
  const [selectedDemanda, setSelectedDemanda] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Minhas tarefas");
  const [viewMode, setViewMode] = useState<ViewMode>(currentUser?.cargo.toLowerCase().includes("gestor") || currentUser?.cargo.toLowerCase().includes("diretor") ? "kanban" : "table");
  const [isNovaDemandaOpen, setNovaDemandaOpen] = useState(false);

  // Theme State synchronized with global document classes
  const [theme, setTheme] = useState<"light" | "dark" | null>(() => {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("gaudium-theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Filters State
  const [selectedPrioridade, setSelectedPrioridade] = useState<string>("Todas");
  const [sortByDeadline, setSortByDeadline] = useState<string>("padrao");
  const [selectedResponsavel, setSelectedResponsavel] = useState<string>("Todos");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredDemandas = useMemo(() => {
    let list = [];
    
    // Tab filtering
    if (activeTab === "Minhas tarefas") {
      list = demandas.filter(d => (d.responsaveis_ids || []).includes(currentUser?.uid || ""));
    } else if (activeTab === "Minhas solicitações") {
      list = demandas.filter(d => d.criado_por === currentUser?.uid);
    } else if (activeTab === "Pendentes") {
      list = demandas.filter(d => d.departamento_destino === currentUser?.departamento && (d.responsaveis_ids || []).length === 0);
    } else {
      list = demandas.filter(d => d.departamento_destino === currentUser?.departamento);
    }

    // Assignee filter check
    if (activeTab === "Todas as tarefas" && selectedResponsavel !== "Todos") {
      if (selectedResponsavel === "Sem Atribuição") {
        list = list.filter(d => (d.responsaveis_ids || []).length === 0);
      } else {
        list = list.filter(d => (d.responsaveis_ids || []).includes(selectedResponsavel));
      }
    }

    // Priority filter check
    if (selectedPrioridade !== "Todas") {
      list = list.filter(d => d.prioridade === selectedPrioridade);
    }

    // SLA deadline sorting check
    if (sortByDeadline === "urgente-primeiro") {
      list = [...list].sort((a, b) => new Date(a.prazo_sla).getTime() - new Date(b.prazo_sla).getTime());
    } else if (sortByDeadline === "longo-prazo") {
      list = [...list].sort((a, b) => new Date(b.prazo_sla).getTime() - new Date(a.prazo_sla).getTime());
    }

    // Search query filtering
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter(d => 
        d.titulo.toLowerCase().includes(q) || 
        d.descricao.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeTab, demandas, currentUser, selectedPrioridade, sortByDeadline, selectedResponsavel, searchQuery]);

  const userInitials = useMemo(() => {
    if (!currentUser?.nome) return "U";
    return currentUser.nome
      .split(" ")
      .map(n => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }, [currentUser]);

  const unreadNotifsCount = useMemo(() => {
    return notificacoes.filter(n => n.usuario_id === currentUser?.uid && !n.lida).length;
  }, [notificacoes, currentUser]);

  const getHeaderTitle = () => {
    if (activeTab === "Minhas tarefas") return "Minhas Tarefas (Designadas)";
    if (activeTab === "Minhas solicitações") return "Minhas Solicitações (Enviadas)";
    if (activeTab === "Pendentes") return "Tarefas Pendentes de Atribuição";
    if (activeTab === "Notificações") return "Central de Notificações";
    return `Demandas do time • ${currentUser?.departamento}`;
  };

  return (
    <div className="flex h-screen w-full bg-g-bg-primary transition-colors text-g-text-primary font-sans shadow-none">
      {/* Sidebar - Dynamically adapted with Gaudium themes */}
      <aside className="w-64 bg-g-bg-tertiary border-r border-g-border-default text-g-text-primary flex flex-col flex-shrink-0 z-20 shadow-none">
        <div className="p-6 flex items-center gap-3 border-b border-g-border-default">
          <GaudiumLogo className="w-8 h-8" />
          <span className="text-xl font-bold tracking-tight text-g-text-primary">Gaudium Labs</span>
        </div>
        
        <nav className="mt-4 flex-grow px-3 space-y-1">
          <div 
            onClick={() => setActiveTab("Minhas tarefas")}
            className={`p-2.5 pl-3 flex items-center gap-3 cursor-pointer transition-colors ${
              activeTab === "Minhas tarefas" 
                ? 'border-l-[3px] border-l-g-accent bg-g-bg-secondary text-g-text-primary font-bold' 
                : 'text-g-text-secondary hover:text-g-text-primary hover:bg-g-bg-secondary/40 border-l-[3px] border-l-transparent'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-g-accent" />
            <span className="font-semibold text-sm tracking-wide">Minhas tarefas</span>
          </div>
          <div 
            onClick={() => setActiveTab("Minhas solicitações")}
            className={`p-2.5 pl-3 flex items-center gap-3 cursor-pointer transition-colors ${
              activeTab === "Minhas solicitações" 
                ? 'border-l-[3px] border-l-g-accent bg-g-bg-secondary text-g-text-primary font-bold' 
                : 'text-g-text-secondary hover:text-g-text-primary hover:bg-g-bg-secondary/40 border-l-[3px] border-l-transparent'
            }`}
            title="Demandas enviadas por você"
          >
            <Send className="w-4 h-4 text-g-accent" />
            <span className="font-semibold text-sm tracking-wide">Minhas solicitações</span>
          </div>
          <div 
            onClick={() => setActiveTab("Todas as tarefas")}
            className={`p-2.5 pl-3 flex items-center gap-3 cursor-pointer transition-colors ${
              activeTab === "Todas as tarefas" 
                ? 'border-l-[3px] border-l-g-accent bg-g-bg-secondary text-g-text-primary font-bold' 
                : 'text-g-text-secondary hover:text-g-text-primary hover:bg-g-bg-secondary/40 border-l-[3px] border-l-transparent'
            }`}
          >
            <Layers className="w-4 h-4 text-g-accent" />
            <span className="font-semibold text-sm tracking-wide">Todas as tarefas</span>
          </div>
          {(currentUser?.cargo.toLowerCase().includes("gestor") || currentUser?.cargo.toLowerCase().includes("diretor")) && (
            <div 
              onClick={() => setActiveTab("Pendentes")}
              className={`p-2.5 pl-3 flex items-center gap-3 cursor-pointer transition-colors ${
                activeTab === "Pendentes" 
                  ? 'border-l-[3px] border-l-g-accent bg-g-bg-secondary text-g-text-primary font-bold' 
                  : 'text-g-text-secondary hover:text-g-text-primary hover:bg-g-bg-secondary/40 border-l-[3px] border-l-transparent'
              }`}
              title="Tarefas de times externos que precisam de colaborador atribuído"
            >
              <Inbox className="w-4 h-4 text-g-destructive" />
              <span className="font-semibold text-sm tracking-wide flex items-center gap-1.5">
                Pendentes
                {demandas.filter(d => d.departamento_destino === currentUser?.departamento && (d.responsaveis_ids || []).length === 0).length > 0 && (
                  <span className="w-2.5 h-2.5 bg-g-destructive rounded-full inline-block" />
                )}
              </span>
            </div>
          )}

          <div 
            onClick={() => setActiveTab("Notificações")}
            className={`p-2.5 pl-3 flex items-center justify-between cursor-pointer transition-colors ${
              activeTab === "Notificações" 
                ? 'border-l-[3px] border-l-g-accent bg-g-bg-secondary text-g-text-primary font-bold' 
                : 'text-g-text-secondary hover:text-g-text-primary hover:bg-g-bg-secondary/40 border-l-[3px] border-l-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className={`w-4 h-4 ${activeTab === 'Notificações' ? 'text-g-accent' : ''}`} />
              <span className="font-semibold text-sm tracking-wide">Notificações</span>
            </div>
            {unreadNotifsCount > 0 && (
              <span className="bg-g-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center justify-center min-w-[20px]">
                {unreadNotifsCount}
              </span>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-g-border-default bg-g-bg-secondary/50">
          {/* Theme toggler and n8n indicator */}
          <div className="flex flex-col gap-2 mb-4 pt-1">
            <button 
              onClick={toggleTheme}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-g-bg-primary hover:bg-g-border-default border border-g-border-default text-g-text-secondary hover:text-g-text-primary text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-none"
              title="Alternar Tema"
            >
              {theme === "dark" ? <Moon className="w-3.5 h-3.5 text-g-accent" /> : <Sun className="w-3.5 h-3.5 text-g-accent" />}
              <span>Alternar</span>
            </button>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-g-bg-secondary border border-g-border-default rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-g-text-tertiary">n8n conectado</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-g-bg-primary border border-g-border-default text-g-text-primary font-bold flex items-center justify-center text-sm shadow-none overflow-hidden select-none">
              {currentUser?.avatarUrl ? (
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.nome} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                userInitials
              )}
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-sm font-bold truncate text-g-text-primary">{currentUser?.nome}</p>
              {/* Premium geometric sans font fallback replacing font-mono to fulfill Anthropic style user instruction */}
              <p className="text-xs text-g-text-secondary truncate tracking-wider font-sans font-bold uppercase">
                {currentUser?.cargo === "Estagiário de Automação e Inovação" ? "Estág. Automação & Inov." : currentUser?.cargo} • {currentUser?.departamento}
              </p>
            </div>
            <button onClick={logout} className="text-g-text-secondary hover:text-g-destructive p-1.5 transition-colors cursor-pointer" title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col relative overflow-hidden bg-g-bg-primary">
        {/* Header */}
        <header className="h-16 bg-g-bg-primary border-b border-g-border-default px-8 flex items-center justify-between flex-shrink-0 z-10 w-full shadow-none">
          <h2 className="text-sm font-bold uppercase tracking-widest text-g-text-secondary font-sans">
            {getHeaderTitle()}
          </h2>
          
          <div className="flex items-center gap-4">
            {/* Search Input Field */}
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-g-text-tertiary absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por título ou descrição..."
                className="w-64 pl-9 pr-8 py-1.5 bg-g-bg-secondary hover:bg-g-bg-tertiary/20 focus:bg-g-bg-primary text-xs font-medium border border-g-border-default hover:border-g-border-emphasis focus:border-g-accent rounded-lg text-g-text-primary placeholder-g-text-tertiary focus:outline-none transition-all shadow-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-xs font-bold text-g-text-tertiary hover:text-g-text-primary px-1.5 py-0.5 rounded cursor-pointer"
                  title="Limpar busca"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-g-bg-secondary p-1 rounded-lg border border-g-border-default shadow-none">
              <button 
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${viewMode === "kanban" ? 'bg-g-bg-primary text-g-text-primary border border-g-border-default font-bold' : 'text-g-text-secondary hover:text-g-text-primary'}`}
              >
                <Columns className="w-3.5 h-3.5" />
                Quadro
              </button>
              <button 
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${viewMode === "table" ? 'bg-g-bg-primary text-g-text-primary border border-g-border-default font-bold' : 'text-g-text-secondary hover:text-g-text-primary'}`}
              >
                <List className="w-3.5 h-3.5" />
                Tabela
              </button>
            </div>
            
            <button onClick={() => setNovaDemandaOpen(true)} className="flex items-center gap-1.5 bg-g-accent text-g-accent-text px-4.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-g-accent-hover transition-colors shadow-none cursor-pointer">
              <Plus className="w-4 h-4 text-g-accent-text" />
              Nova Demanda
            </button>
          </div>
        </header>

        {/* Filter Bar with high-end designer layout */}
        <div className="px-8 py-3 bg-g-bg-secondary/40 border-b border-g-border-default flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2 text-g-text-tertiary">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="text-xs uppercase tracking-wider font-bold font-sans">Filtros</span>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-sans tracking-wide text-g-text-secondary font-bold uppercase">Prioridade:</span>
              <select
                value={selectedPrioridade}
                onChange={(e) => setSelectedPrioridade(e.target.value)}
                className="bg-g-bg-primary border border-g-border-default text-sm font-semibold rounded-lg px-3 py-1.5 text-g-text-primary focus:outline-none focus:ring-1 focus:ring-g-accent cursor-pointer shadow-none"
              >
                <option value="Todas">Todas</option>
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>

            {/* Deadline Sort */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-sans tracking-wide text-g-text-secondary font-bold uppercase">Ordenar por Prazo:</span>
              <select
                value={sortByDeadline}
                onChange={(e) => setSortByDeadline(e.target.value)}
                className="bg-g-bg-primary border border-g-border-default text-sm font-semibold rounded-lg px-3 py-1.5 text-g-text-primary focus:outline-none focus:ring-1 focus:ring-g-accent cursor-pointer shadow-none"
              >
                <option value="padrao">Padrão</option>
                <option value="urgente-primeiro">Mais urgentes (SLA perto)</option>
                <option value="longo-prazo">Mais distantes (SLA longe)</option>
              </select>
            </div>

            {/* Responsável Filter */}
            {activeTab === "Todas as tarefas" && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                <span className="text-xs font-sans tracking-wide text-g-text-secondary font-bold uppercase">Responsável:</span>
                <select
                  value={selectedResponsavel}
                  onChange={(e) => setSelectedResponsavel(e.target.value)}
                  className="bg-g-bg-primary border border-g-border-default text-sm font-semibold rounded-lg px-3 py-1.5 text-g-text-primary focus:outline-none focus:ring-1 focus:ring-g-accent cursor-pointer shadow-none"
                >
                  <option value="Todos">Todos</option>
                  <option value="Sem Atribuição">Sem Atribuição</option>
                  {MOCK_USERS.map(user => (
                    <option key={user.uid} value={user.uid}>{user.nome}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="text-xs font-sans font-bold text-g-text-primary bg-g-bg-secondary border border-g-border-default px-2.5 py-1 rounded">
            {filteredDemandas.length} {filteredDemandas.length === 1 ? "demanda" : "demandas"}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 flex-grow overflow-auto bg-g-bg-primary">
          {activeTab === "Notificações" ? (
            <NotificacoesList />
          ) : (
            <>
              <StatusChart />
              {activeTab === "Pendentes" && (
                <div className="mb-6 p-4 rounded-xl bg-g-accent/10 border border-g-accent/20 text-g-text-primary text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300 shadow-none">
                  <span className="w-2 h-2 rounded-full bg-g-accent animate-pulse" />
                  <span>Aguardando triagem, atribua as tarefas ao(s) responsável(is)</span>
                </div>
              )}
              {viewMode === "kanban" ? (
                <GestorBoard demandas={filteredDemandas} onCardClick={setSelectedDemanda} />
              ) : (
                <DemandasTable demandas={filteredDemandas} onRowClick={setSelectedDemanda} />
              )}

              {filteredDemandas.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-g-text-tertiary">
                  <p className="font-semibold text-sm text-g-text-secondary">Nenhuma demanda encontrada neste filtro/tela</p>
                  <p className="text-xs font-mono mt-1 opacity-80">Gaudium Labs Sandbox</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modals & Sidebars */}
      {selectedDemanda && (
        <DemandaDetailSidebar 
          demandaId={selectedDemanda} 
          onClose={() => setSelectedDemanda(null)} 
        />
      )}
      
      {isNovaDemandaOpen && (
        <NovaDemandaModal onClose={() => setNovaDemandaOpen(false)} />
      )}
    </div>
  );
}
