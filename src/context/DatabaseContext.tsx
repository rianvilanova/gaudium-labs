import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Demanda, HistoricoDemanda, Status, Notificacao, TipoNotificacao } from "../types";
import { MOCK_DEMANDAS, MOCK_HISTORICO, MOCK_USERS } from "../data";
import { useAuth } from "./AuthContext";

export const WEBHOOK_URL = "https://rianlabs.app.n8n.cloud/webhook-test/9734d683-1dc6-4641-8270-f137387ed669";

export const enviarWebhookDemanda = async (evento: string, demanda: Demanda) => {
  try {
    // Busca o criador nos usuários para obter o departamento do solicitante que abriu o chamado
    const criador = MOCK_USERS.find(u => u.uid === demanda.criado_por);
    const departamento_solicitante = criador ? criador.departamento : "";
    const criador_nome = criador ? criador.nome : demanda.criado_por;

    // Mapeia os ids dos responsáveis para seus respectivos nomes reais
    const responsaveis_nomes = (demanda.responsaveis_ids || []).map(id => {
      const u = MOCK_USERS.find(user => user.uid === id);
      return u ? u.nome : id;
    });

    // Constrói o objeto demanda adaptado com nomes ao invés de IDs para os responsáveis e o criador
    const demandaAdaptada = {
      ...demanda,
      criado_por: criador_nome, // em vez de dizer o ID do criador, diz o nome do colaborador
      responsaveis_ids: responsaveis_nomes, // em vez de dizer o id dos responsáveis, diz o nome
      responsaveis_nomes: responsaveis_nomes,
      responsaveis: responsaveis_nomes,
      ...(evento === "demanda_criada" ? { departamento_solicitante } : {})
    };

    const payload = {
      evento,
      demanda: demandaAdaptada,
      ...(evento === "demanda_criada" ? { departamento_solicitante } : {})
    };
    
    // Enviamos para o nosso proxy local (/api/webhook) no backend para evitar problemas de CORS no navegador
    const response = await fetch("/api/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.error(`Status de erro retornado pelo webhook (${evento}): ${response.status}`);
    }
  } catch (e) {
    console.error(`Status de erro (catch) ao disparar webhook para o evento [${evento}]:`, e);
  }
};

interface DatabaseContextType {
  demandas: Demanda[];
  historico: HistoricoDemanda[];
  statuses: string[];
  notificacoes: Notificacao[];
  addDemanda: (demanda: Omit<Demanda, "id" | "criado_em" | "criado_por" | "status"> & { responsaveis_ids?: string[] }, justificativaIA?: string) => void;
  updateDemandaStatus: (id: string, newStatus: Status) => void;
  updateDemanda: (id: string, updates: Partial<Demanda>) => void;
  deleteDemanda: (id: string) => void;
  getDemandaHistorico: (demandaId: string) => HistoricoDemanda[];
  addStatus: (statusName: string) => void;
  editStatus: (oldStatusName: string, newStatusName: string) => void;
  deleteStatus: (statusName: string) => void;
  assignResponsaveis: (demandaId: string, responsaveisIds: string[]) => void;
  markNotificacaoAsRead: (id: string) => void;
  enviarWebhookDemanda: (evento: string, demanda: Demanda) => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();

  const [demandas, setDemandas] = useState<Demanda[]>(() => {
    let rawList: any[] = [];
    const saved = localStorage.getItem("g_labs_demandas");
    if (saved) {
      try {
        rawList = JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing g_labs_demandas", e);
        rawList = MOCK_DEMANDAS;
      }
    } else {
      rawList = MOCK_DEMANDAS;
    }
    
    // Migrate to responsaveis_ids array if it was stored as responsavel_id string
    return rawList.map(item => {
      if (Array.isArray(item.responsaveis_ids)) {
        return item;
      }
      const responsaveis_ids = item.responsavel_id ? [item.responsavel_id] : [];
      const { responsavel_id, ...rest } = item;
      return {
        ...rest,
        responsaveis_ids
      } as Demanda;
    });
  });

  const [historico, setHistorico] = useState<HistoricoDemanda[]>(() => {
    const saved = localStorage.getItem("g_labs_historico");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing g_labs_historico", e);
      }
    }
    return MOCK_HISTORICO;
  });

  const [statuses, setStatuses] = useState<string[]>(() => {
    const saved = localStorage.getItem("g_labs_statuses");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing g_labs_statuses", e);
      }
    }
    return ["Pendente", "Em Andamento", "Concluído"];
  });

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>(() => {
    const saved = localStorage.getItem("g_labs_notificacoes");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing g_labs_notificacoes", e);
      }
    }
    return [];
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem("g_labs_demandas", JSON.stringify(demandas));
  }, [demandas]);

  useEffect(() => {
    localStorage.setItem("g_labs_historico", JSON.stringify(historico));
  }, [historico]);

  useEffect(() => {
    localStorage.setItem("g_labs_statuses", JSON.stringify(statuses));
  }, [statuses]);

  useEffect(() => {
    localStorage.setItem("g_labs_notificacoes", JSON.stringify(notificacoes));
  }, [notificacoes]);

  // Observação: Função global e centralizada 'enviarWebhookDemanda' definida no topo deste arquivo.

  const createNotifications = (
    usuariosIds: string[],
    titulo: string,
    mensagem: string,
    tipo: TipoNotificacao
  ) => {
    const uniqueIds = Array.from(new Set(usuariosIds));
    const novas = uniqueIds.map(uid => ({
      id: `notif-${Date.now()}-${uid}-${Math.random().toString(36).substring(2, 9)}`,
      usuario_id: uid,
      titulo,
      mensagem,
      tipo,
      lida: false,
      criado_em: new Date().toISOString()
    }));
    if (novas.length > 0) {
      setNotificacoes(prev => [...novas, ...prev]);
    }
  };

  const markNotificacaoAsRead = (id: string) => {
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  const addDemanda = (
    demandaData: Omit<Demanda, "id" | "criado_em" | "criado_por" | "status" | "responsaveis_ids"> & { responsaveis_ids?: string[] },
    justificativaIA?: string
  ) => {
    if (!currentUser) return;
    
    const novaDemanda: Demanda = {
      ...demandaData,
      id: `demanda-${Date.now()}`,
      criado_em: new Date().toISOString(),
      criado_por: currentUser.uid,
      status: statuses[0] || "Pendente",
      responsaveis_ids: demandaData.responsaveis_ids || [],
    };
    
    setDemandas(prev => [novaDemanda, ...prev]);
    
    const descricao_acao = justificativaIA 
      ? `Demanda criada por ${currentUser.nome} com suporte da IA. Decisão da IA: ${justificativaIA}`
      : `Demanda criada por ${currentUser.nome}.`;
    
    const historicoEntry: HistoricoDemanda = {
      id: `hist-${Date.now()}`,
      demanda_id: novaDemanda.id,
      descricao_acao,
      alterado_em: new Date().toISOString(),
      alterado_por: currentUser.uid,
    };
    
    setHistorico(prev => [historicoEntry, ...prev]);

    // Notify Gestores/Diretores in the target dept
    const targetDeptUsers = MOCK_USERS.filter(u => 
      u.departamento === novaDemanda.departamento_destino && 
      (u.cargo.toLowerCase().includes("gestor") || u.cargo.toLowerCase().includes("diretor"))
    ).map(u => u.uid);
    // Include creator if they want to be notified? Not for creation probably
    createNotifications(
      targetDeptUsers,
      "Nova demanda criada",
      `Uma nova demanda "${novaDemanda.titulo}" foi criada para o seu setor.`,
      "demanda_criada"
    );

    // COMENTÁRIO: Evento 'demanda_criada' é disparado logo após a inserção bem-sucedida de uma nova demanda
    enviarWebhookDemanda("demanda_criada", novaDemanda);
  };

  const updateDemandaStatus = (id: string, newStatus: Status) => {
    if (!currentUser) return;

    const dObj = demandas.find(d => d.id === id);
    const isResponsavel = dObj?.responsaveis_ids?.includes(currentUser.uid);
    const isGestorOuDiretor = currentUser.cargo.toLowerCase().includes("gestor") || currentUser.cargo.toLowerCase().includes("diretor");

    if (dObj && dObj.criado_por === currentUser.uid && !isResponsavel && !isGestorOuDiretor) {
      console.warn("Solicitante não pode alterar o status da própria demanda");
      return;
    }

    let updatedDemanda: Demanda | undefined;
    setDemandas(prev => prev.map(d => {
      if (d.id === id) {
        updatedDemanda = { ...d, status: newStatus };
        return updatedDemanda;
      }
      return d;
    }));

    const historicoEntry: HistoricoDemanda = {
      id: `hist-${Date.now()}`,
      demanda_id: id,
      descricao_acao: `Status alterado para '${newStatus}' por ${currentUser.nome}.`,
      alterado_em: new Date().toISOString(),
      alterado_por: currentUser.uid,
    };
    
    setHistorico(prev => [historicoEntry, ...prev]);

    // Trigger webhook events
    if (updatedDemanda) {
      const isConcluida = newStatus.toLowerCase() === "concluído" || newStatus.toLowerCase() === "concluida" || newStatus.toLowerCase() === "concluido";
      const tipo: TipoNotificacao = isConcluida ? "demanda_concluida" : "status_alterado";
      const tit = isConcluida ? "Demanda concluída" : "Status atualizado";
      const msg = isConcluida 
        ? `A demanda "${updatedDemanda.titulo}" foi concluída.` 
        : `A demanda "${updatedDemanda.titulo}" foi alterada para ${newStatus}.`;

      const usersToNotify = [updatedDemanda.criado_por, ...(updatedDemanda.responsaveis_ids || [])]
        .filter(uid => uid !== currentUser.uid); // Don't notify the user who made the change
      
      createNotifications(usersToNotify, tit, msg, tipo);

      // COMENTÁRIO: Evento 'status_alterado' disparado sempre que o status de uma demanda mudar
      enviarWebhookDemanda("status_alterado", updatedDemanda);
    }
  };

  const getDemandaHistorico = (demandaId: string) => {
    return historico
      .filter(h => h.demanda_id === demandaId)
      .sort((a, b) => new Date(b.alterado_em).getTime() - new Date(a.alterado_em).getTime());
  };

  const addStatus = (statusName: string) => {
    const trimmed = statusName.trim();
    if (!trimmed) return;
    if (statuses.some(s => s.toLowerCase() === trimmed.toLowerCase())) return;
    setStatuses(prev => [...prev, trimmed]);
  };

  const editStatus = (oldStatusName: string, newStatusName: string) => {
    const trimmedNew = newStatusName.trim();
    if (!trimmedNew || trimmedNew.toLowerCase() === oldStatusName.toLowerCase()) return;
    
    // check for duplicate (excluding the old one itself)
    if (statuses.some(s => s.toLowerCase() === trimmedNew.toLowerCase() && s !== oldStatusName)) return;

    setStatuses(prev => prev.map(s => s === oldStatusName ? trimmedNew : s));
    setDemandas(prev => prev.map(d => d.status === oldStatusName ? { ...d, status: trimmedNew } : d));
  };

  const deleteStatus = (statusName: string) => {
    setStatuses(prev => prev.filter(s => s !== statusName));
    const nextStatus = statuses.find(s => s !== statusName) || "Pendente";
    setDemandas(prev => prev.map(d => d.status === statusName ? { ...d, status: nextStatus } : d));
  };

  const assignResponsaveis = (id: string, responsaveisIds: string[]) => {
    if (!currentUser) return;

    const dObj = demandas.find(d => d.id === id);
    if (dObj && dObj.criado_por === currentUser.uid) {
      console.warn("Solicitante não pode alterar os responsáveis da própria demanda");
      return;
    }

    let updatedDemanda: Demanda | undefined;
    setDemandas(prev => prev.map(d => {
      if (d.id === id) {
        updatedDemanda = { ...d, responsaveis_ids: responsaveisIds };
        return updatedDemanda;
      }
      return d;
    }));

    const names = responsaveisIds
      .map(uid => MOCK_USERS.find(u => u.uid === uid)?.nome || uid)
      .join(", ");

    const actionDesc = responsaveisIds.length > 0 
      ? `Responsáveis atribuídos: ${names} (por ${currentUser.nome}).`
      : `Responsáveis removidos (por ${currentUser.nome}).`;

    const historicoEntry: HistoricoDemanda = {
      id: `hist-${Date.now()}`,
      demanda_id: id,
      descricao_acao: actionDesc,
      alterado_em: new Date().toISOString(),
      alterado_por: currentUser.uid,
    };
    
    setHistorico(prev => [historicoEntry, ...prev]);

    // Trigger webhook event
    if (updatedDemanda) {
      if (responsaveisIds.length > 0) {
        const usersToNotify = [...responsaveisIds, updatedDemanda.criado_por]
          .filter(uid => uid !== currentUser?.uid);
        const nomesRecentes = responsaveisIds.map(uid => MOCK_USERS.find(user => user.uid === uid)?.nome || uid).join(", ");
        createNotifications(
          usersToNotify,
          "Responsável atribuído",
          `A demanda "${updatedDemanda.titulo}" foi atribuída para ${nomesRecentes}.`,
          "responsavel_atribuido"
        );
      }
      
      // COMENTÁRIO: Evento 'responsavel_atribuido' disparado quando novos responsáveis são atribuídos a uma demanda
      enviarWebhookDemanda("responsavel_atribuido", updatedDemanda);
    }
  };

  const deleteDemanda = (id: string) => {
    if (!currentUser) return;
    setDemandas(prev => prev.filter(d => d.id !== id));
  };

  const updateDemanda = (id: string, updates: Partial<Demanda>) => {
    if (!currentUser) return;

    const dObj = demandas.find(d => d.id === id);
    const isResponsavel = dObj?.responsaveis_ids?.includes(currentUser.uid);
    const isGestorOuDiretor = currentUser.cargo.toLowerCase().includes("gestor") || currentUser.cargo.toLowerCase().includes("diretor");

    if (dObj && dObj.criado_por === currentUser.uid && !isResponsavel && !isGestorOuDiretor) {
      const filteredUpdates = { ...updates };
      delete filteredUpdates.status;
      delete filteredUpdates.responsaveis_ids;
      updates = filteredUpdates;
    }

    let updatedDemanda: Demanda | undefined;
    let oldDemanda: Demanda | undefined;
    
    setDemandas(prev => prev.map(d => {
      if (d.id === id) {
        oldDemanda = d;
        updatedDemanda = { ...d, ...updates };
        return updatedDemanda;
      }
      return d;
    }));

    if (!oldDemanda || !updatedDemanda) return;

    const changes: string[] = [];
    if (updates.titulo !== undefined && updates.titulo !== oldDemanda.titulo) {
      changes.push(`Título atualizado para "${updates.titulo}"`);
    }
    if (updates.descricao !== undefined && updates.descricao !== oldDemanda.descricao) {
      changes.push(`Descrição atualizada`);
    }
    if (updates.prioridade !== undefined && updates.prioridade !== oldDemanda.prioridade) {
      changes.push(`Prioridade alterada para "${updates.prioridade}"`);
    }
    if (updates.responsaveis_ids !== undefined && JSON.stringify(updates.responsaveis_ids) !== JSON.stringify(oldDemanda.responsaveis_ids)) {
      const names = updates.responsaveis_ids
        .map(uid => MOCK_USERS.find(u => u.uid === uid)?.nome || uid)
        .join(", ");
      changes.push(updates.responsaveis_ids.length > 0 
        ? `Responsáveis atualizados: ${names}`
        : `Responsáveis removidos`
      );
    }
    if (updates.status !== undefined && updates.status !== oldDemanda.status) {
      changes.push(`Status alterado para "${updates.status}"`);
    }
    if (updates.prazo_sla !== undefined && updates.prazo_sla !== oldDemanda.prazo_sla) {
      changes.push(`Prazo (SLA) alterado para "${updates.prazo_sla.split('T')[0]}"`);
    }

    if (changes.length > 0) {
      const actionDesc = `${changes.join(", ")} por ${currentUser.nome}.`;
      const historicoEntry: HistoricoDemanda = {
        id: `hist-${Date.now()}`,
        demanda_id: id,
        descricao_acao: actionDesc,
        alterado_em: new Date().toISOString(),
        alterado_por: currentUser.uid,
      };
      setHistorico(prev => [historicoEntry, ...prev]);
    }

    // Trigger webhook events for general updates
    if (updatedDemanda && oldDemanda) {
      const statusChanged = updates.status !== undefined && updates.status !== oldDemanda.status;
      const responsaveisChanged = updates.responsaveis_ids !== undefined && JSON.stringify(updates.responsaveis_ids) !== JSON.stringify(oldDemanda.responsaveis_ids);

      if (statusChanged) {
        const newStatus = updatedDemanda.status;
        const isConcluida = newStatus.toLowerCase() === "concluído" || newStatus.toLowerCase() === "concluida" || newStatus.toLowerCase() === "concluido";
        const tipo: TipoNotificacao = isConcluida ? "demanda_concluida" : "status_alterado";
        const tit = isConcluida ? "Demanda concluída" : "Status atualizado";
        const msg = isConcluida 
          ? `A demanda "${updatedDemanda.titulo}" foi concluída.` 
          : `A demanda "${updatedDemanda.titulo}" foi alterada para ${newStatus}.`;

        const usersToNotify = [updatedDemanda.criado_por, ...(updatedDemanda.responsaveis_ids || [])]
          .filter(uid => uid !== currentUser?.uid);
        
        createNotifications(usersToNotify, tit, msg, tipo);

        // COMENTÁRIO: Evento 'status_alterado' disparado se o status mudar através do formulário de edição geral
        enviarWebhookDemanda("status_alterado", updatedDemanda);
      }

      if (responsaveisChanged) {
        if ((updatedDemanda.responsaveis_ids || []).length > 0) {
          const uIds = updatedDemanda.responsaveis_ids || [];
          const usersToNotify = [...uIds, updatedDemanda.criado_por]
            .filter(uid => uid !== currentUser?.uid);
          const nomesRecentes = uIds.map((uid: string) => MOCK_USERS.find(user => user.uid === uid)?.nome || uid).join(", ");
          createNotifications(
            usersToNotify,
            "Responsável atribuído",
            `A demanda "${updatedDemanda.titulo}" foi atribuída para ${nomesRecentes}.`,
            "responsavel_atribuido"
          );
        }

        // COMENTÁRIO: Evento 'responsavel_atribuido' disparado se os responsáveis mudarem através do formulário de edição geral
        enviarWebhookDemanda("responsavel_atribuido", updatedDemanda);
      }
    }
  };

  return (
    <DatabaseContext.Provider value={{
      demandas,
      historico,
      statuses,
      notificacoes,
      addDemanda,
      updateDemandaStatus,
      updateDemanda,
      deleteDemanda,
      getDemandaHistorico,
      addStatus,
      editStatus,
      deleteStatus,
      assignResponsaveis,
      markNotificacaoAsRead,
      enviarWebhookDemanda
    }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
}
