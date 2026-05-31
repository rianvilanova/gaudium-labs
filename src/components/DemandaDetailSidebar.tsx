import React, { useState } from "react";
import { useDatabase } from "../context/DatabaseContext";
import { useAuth } from "../context/AuthContext";
import { MOCK_USERS } from "../data";
import { X, Clock, User as UserIcon, Calendar, Activity } from "lucide-react";
import { format } from "date-fns";
import { Prioridade } from "../types";

export function DemandaDetailSidebar({ demandaId, onClose }: { demandaId: string, onClose: () => void }) {
  const { currentUser } = useAuth();
  const { demandas, getDemandaHistorico, statuses, updateDemandaStatus, assignResponsaveis, updateDemanda, deleteDemanda } = useDatabase();
  
  const demanda = demandas.find(d => d.id === demandaId);
  const historico = getDemandaHistorico(demandaId);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editPrioridade, setEditPrioridade] = useState<Prioridade>("Média");
  const [editResponsaveisIds, setEditResponsaveisIds] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  React.useEffect(() => {
    if (demanda) {
      setEditTitulo(demanda.titulo);
      setEditDescricao(demanda.descricao);
      setEditPrioridade(demanda.prioridade);
      setEditResponsaveisIds(demanda.responsaveis_ids || []);
      setIsEditing(false);
      setConfirmDelete(false);
    }
  }, [demandaId, demanda]);

  if (!demanda) return null;

  const isCreatorOfDemanda = currentUser?.uid === demanda.criado_por;
  const isResponsavelOfDemanda = (demanda.responsaveis_ids || []).includes(currentUser?.uid || "");
  const isUserInTargetDepartment = currentUser?.departamento === demanda.departamento_destino;
  const isGestorOuDiretorOfTargetDepartment = isUserInTargetDepartment && (currentUser?.cargo.toLowerCase().includes("gestor") || currentUser?.cargo.toLowerCase().includes("diretor"));
  
  const canUpdateStatus = isGestorOuDiretorOfTargetDepartment || isResponsavelOfDemanda;
  const canEditOrDelete = isCreatorOfDemanda || isGestorOuDiretorOfTargetDepartment;

  const creatorUser = MOCK_USERS.find(u => u.uid === demanda.criado_por);
  const creatorName = creatorUser ? creatorUser.nome : "Desconhecido";

  const prioridadeStyles: Record<string, { backgroundColor: string; color: string; borderColor: string }> = {
    'Crítica': { backgroundColor: '#3D0E0E', color: '#F47070', borderColor: '#6B1C1C' },
    'Alta': { backgroundColor: '#2E1E00', color: '#F4A830', borderColor: '#5C3C00' },
    'Média': { backgroundColor: '#1A1600', color: '#F4C430', borderColor: '#3D3000' },
    'Baixa': { backgroundColor: '#1A1A1A', color: '#888884', borderColor: '#2A2A2A' }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop with elegant blur */}
      <div 
        className="absolute inset-0 bg-[#000000]/60 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose} 
      />
      
      {/* Centered Modal Card */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-g-bg-primary rounded-2xl shadow-none border border-g-border-emphasis overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-g-border-default flex items-start justify-between bg-g-bg-secondary/50">
          <div className="flex-grow">
            <h2 className="text-xs font-bold text-g-text-tertiary uppercase tracking-widest font-mono mb-1">
              {demanda.id}
            </h2>
            {isEditing ? (
              <div className="mt-1">
                <label className="block text-[10px] font-bold text-g-text-tertiary uppercase tracking-wider font-mono mb-1">
                  Título da Demanda
                </label>
                <input
                  type="text"
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  className="w-full max-w-lg bg-g-bg-primary border border-g-border-emphasis rounded-lg px-3 py-1.5 text-sm font-semibold text-g-text-primary focus:outline-none focus:ring-1 focus:ring-g-accent focus:border-g-accent shadow-none font-sans"
                  placeholder="Título..."
                />
              </div>
            ) : (
              <h1 className="text-xl font-bold text-g-text-primary leading-snug tracking-tight">
                {demanda.titulo}
              </h1>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-g-bg-tertiary text-g-text-tertiary hover:text-g-text-primary transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-4 bg-g-bg-secondary/40 p-3 rounded-xl border border-g-border-default/50">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-g-text-tertiary uppercase tracking-wider font-mono">Status</span>
              <select
                value={demanda.status}
                disabled={!canUpdateStatus}
                onChange={(e) => updateDemandaStatus(demanda.id, e.target.value)}
                className="bg-g-bg-primary border border-g-border-default text-xs font-semibold rounded-lg px-2.5 py-1 text-g-text-primary focus:outline-none focus:ring-1 focus:ring-g-accent transition-all cursor-pointer shadow-none disabled:opacity-60 disabled:cursor-not-allowed"
                title={!canUpdateStatus ? "O solicitante não pode alterar o status desta demanda" : undefined}
              >
                {statuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-g-text-tertiary uppercase tracking-wider font-mono">Prioridade</span>
              {isEditing ? (
                <select
                  value={editPrioridade}
                  onChange={(e) => setEditPrioridade(e.target.value as Prioridade)}
                  className="bg-g-bg-primary border border-g-border-default text-xs font-semibold rounded-lg px-2 py-1 text-g-text-primary focus:outline-none focus:ring-1 focus:ring-g-accent cursor-pointer"
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                  <option value="Crítica">Crítica</option>
                </select>
              ) : (
                <span 
                  className="px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider leading-none text-center border font-sans"
                  style={prioridadeStyles[demanda.prioridade] || prioridadeStyles['Baixa']}
                >
                  {demanda.prioridade}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-g-text-tertiary uppercase tracking-wider font-mono">Departamento</span>
              <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-mono font-bold bg-g-bg-tertiary text-g-text-primary border border-g-border-default">
                {demanda.departamento_destino}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-g-text-tertiary font-mono">
              Descrição da Demanda
            </h3>
            {isEditing ? (
              <textarea
                rows={4}
                value={editDescricao}
                onChange={(e) => setEditDescricao(e.target.value)}
                className="w-full bg-g-bg-primary border border-g-border-emphasis rounded-xl p-3 text-sm font-semibold leading-relaxed text-g-text-primary focus:outline-none focus:ring-1 focus:ring-g-accent resize-none shadow-none font-sans"
                placeholder="Insira detalhes da demanda..."
              />
            ) : (
              <div className="bg-g-bg-secondary/30 rounded-xl p-4 text-sm font-semibold leading-relaxed text-g-text-secondary whitespace-pre-wrap border border-g-border-default/50">
                {demanda.descricao}
              </div>
            )}
          </div>

          {/* SLA and Creator info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-4 text-sm pt-4 border-t border-g-border-default">
            <div className="space-y-1">
              <span className="text-g-text-tertiary flex items-center gap-1.5 text-xs uppercase font-bold font-mono"><UserIcon className="w-3.5 h-3.5 text-g-accent"/> Solicitante</span>
              <p className="font-bold text-sm text-g-text-primary">{creatorName}</p>
            </div>
            <div className="space-y-1">
              <span className="text-g-text-tertiary flex items-center gap-1.5 text-xs uppercase font-bold font-mono"><Calendar className="w-3.5 h-3.5 text-g-accent"/> Aberto em</span>
              <p className="font-semibold text-sm text-g-text-secondary font-mono">{format(new Date(demanda.criado_em), "dd/MM/yyyy HH:mm")}</p>
            </div>
            <div className="space-y-1">
              <span className="text-g-text-tertiary flex items-center gap-1.5 text-xs uppercase font-bold font-mono"><Clock className="w-3.5 h-3.5 text-g-destructive"/> Prazo Limite (SLA)</span>
              <p className="font-bold text-sm text-g-destructive font-mono">{format(new Date(demanda.prazo_sla), "dd/MM/yyyy")}</p>
            </div>

            <div className="space-y-1 md:col-span-2 mt-2">
              <span className="text-g-text-tertiary flex items-center gap-1.5 text-xs uppercase font-bold font-mono"><Activity className="w-3.5 h-3.5 text-g-accent"/> Responsáveis</span>
              {isEditing ? (
                isGestorOuDiretorOfTargetDepartment ? (
                  <div className="mt-1 border border-g-border-default rounded-xl p-3 max-h-48 overflow-y-auto bg-g-bg-secondary/30 space-y-1.5 shadow-none">
                    {MOCK_USERS.filter(user => user.departamento === demanda.departamento_destino).map(user => {
                      const isChecked = editResponsaveisIds.includes(user.uid);
                      return (
                        <label key={user.uid} className="flex items-center gap-3 px-2.5 py-1.5 rounded-lg hover:bg-g-bg-secondary cursor-pointer text-sm font-semibold select-none transition-all border border-transparent hover:border-g-border-default">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const updatedList = e.target.checked
                                ? [...editResponsaveisIds, user.uid]
                                : editResponsaveisIds.filter(id => id !== user.uid);
                              setEditResponsaveisIds(updatedList);
                            }}
                            className="rounded border-g-border-default bg-g-bg-primary text-g-accent focus:ring-g-accent w-4 h-4 cursor-pointer"
                          />
                          <span className="text-g-text-primary flex-grow leading-tight">
                            {user.nome}
                          </span>
                          <span className="text-xs py-0.5 px-2 bg-g-bg-tertiary rounded font-mono font-bold text-g-text-secondary uppercase tracking-wide border border-g-border-default">
                            {user.departamento} • {user.cargo === "Estagiário de Automação e Inovação" ? "Estág. Automação & Inov." : user.cargo}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {editResponsaveisIds.length > 0 ? (
                      editResponsaveisIds.map(id => {
                        const u = MOCK_USERS.find(user => user.uid === id);
                        return (
                          <div key={id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-g-bg-secondary text-g-text-primary border border-g-border-default">
                            <span className="w-1.5 h-1.5 rounded-full bg-g-accent" />
                            <span>{u ? `${u.nome} (${u.cargo === "Estagiário de Automação e Inovação" ? "Estág. Automação & Inov." : u.cargo})` : id}</span>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-g-text-tertiary text-sm font-semibold pl-1">Não atribuído</span>
                    )}
                  </div>
                )
              ) : (
                isGestorOuDiretorOfTargetDepartment ? (
                  <div className="mt-1 border border-g-border-default rounded-xl p-3 max-h-48 overflow-y-auto bg-g-bg-secondary/30 space-y-1.5 shadow-none">
                    {MOCK_USERS.filter(user => user.departamento === demanda.departamento_destino).map(user => {
                      const isChecked = (demanda.responsaveis_ids || []).includes(user.uid);
                      return (
                        <label key={user.uid} className="flex items-center gap-3 px-2.5 py-1.5 rounded-lg hover:bg-g-bg-secondary cursor-pointer text-sm font-semibold select-none transition-all border border-transparent hover:border-g-border-default">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const updatedList = e.target.checked
                                ? [...(demanda.responsaveis_ids || []), user.uid]
                                : (demanda.responsaveis_ids || []).filter(id => id !== user.uid);
                              assignResponsaveis(demanda.id, updatedList);
                            }}
                            className="rounded border-g-border-default bg-g-bg-primary text-g-accent focus:ring-g-accent w-4 h-4 cursor-pointer"
                          />
                          <span className="text-g-text-primary flex-grow leading-tight">
                            {user.nome}
                          </span>
                          <span className="text-xs py-0.5 px-2 bg-g-bg-tertiary rounded font-mono font-bold text-g-text-secondary uppercase tracking-wide border border-g-border-default">
                            {user.departamento} • {user.cargo === "Estagiário de Automação e Inovação" ? "Estág. Automação & Inov." : user.cargo}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(demanda.responsaveis_ids || []).length > 0 ? (
                      (demanda.responsaveis_ids || []).map(id => {
                        const u = MOCK_USERS.find(user => user.uid === id);
                        return (
                          <div key={id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-g-bg-secondary text-g-text-primary border border-g-border-default">
                            <span className="w-1.5 h-1.5 rounded-full bg-g-accent" />
                            <span>{u ? `${u.nome} (${u.cargo === "Estagiário de Automação e Inovação" ? "Estág. Automação & Inov." : u.cargo})` : id}</span>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-g-text-tertiary text-sm font-semibold pl-1">Não atribuído</span>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Timeline History */}
          <div className="space-y-3 pt-4 border-t border-g-border-default">
            <h3 className="text-xs font-bold uppercase tracking-wider text-g-text-tertiary font-mono">
              Histórico de Ações
            </h3>
            <div className="relative border-l border-g-border-default ml-2.5 space-y-4 pt-1">
              {historico.map((hist) => (
                <div key={hist.id} className="relative pl-5">
                  <div className="absolute w-2.5 h-2.5 bg-g-accent rounded-full -left-[5px] top-1.5 border border-g-bg-primary" />
                  <div className="text-xs text-g-text-tertiary font-mono mb-0.5">
                    {format(new Date(hist.alterado_em), "dd MMM yyyy, HH:mm")}
                  </div>
                  <p className="text-sm text-g-text-secondary leading-normal font-medium">
                    {hist.descricao_acao}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-g-border-default flex items-center justify-between bg-g-bg-secondary/50">
          <div>
            {canEditOrDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-g-destructive font-bold uppercase tracking-wide select-none font-mono">Tem certeza?</span>
                  <button
                    type="button"
                    onClick={() => {
                      deleteDemanda(demanda.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-g-destructive hover:bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-none"
                  >
                    Confirmar Exclusão
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 bg-g-bg-secondary hover:bg-g-bg-tertiary text-g-text-primary border border-g-border-default rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-none"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-1.5 border border-red-500/30 hover:border-red-500 hover:bg-red-500/10 text-red-500 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-none"
                >
                  Excluir
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditTitulo(demanda.titulo);
                    setEditDescricao(demanda.descricao);
                    setEditPrioridade(demanda.prioridade as Prioridade);
                    setEditResponsaveisIds(demanda.responsaveis_ids || []);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-g-bg-secondary hover:bg-g-bg-tertiary text-g-text-primary border border-g-border-default rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-none"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateDemanda(demanda.id, {
                      titulo: editTitulo,
                      descricao: editDescricao,
                      prioridade: editPrioridade,
                      responsaveis_ids: editResponsaveisIds
                    });
                    setIsEditing(false);
                  }}
                  className="px-5 py-2.5 bg-g-accent hover:bg-g-accent-hover text-g-accent-text rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-none"
                >
                  Salvar
                </button>
              </>
            ) : (
              <>
                {canEditOrDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditTitulo(demanda.titulo);
                      setEditDescricao(demanda.descricao);
                      setEditPrioridade(demanda.prioridade as Prioridade);
                      setEditResponsaveisIds(demanda.responsaveis_ids || []);
                      setIsEditing(true);
                    }}
                    className="px-4 py-2 bg-g-bg-secondary hover:bg-g-bg-tertiary text-g-text-primary border border-g-border-default rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-none"
                  >
                    Editar
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-g-bg-secondary hover:bg-g-bg-tertiary text-g-text-primary border border-g-border-default rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-none"
                >
                  Fechar
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
