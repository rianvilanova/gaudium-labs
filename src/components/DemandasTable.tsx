import React from "react";
import { Demanda } from "../types";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { MOCK_USERS } from "../data";

export function DemandasTable({ demandas, onRowClick }: { demandas: Demanda[], onRowClick: (demandaId: string) => void }) {
  const { currentUser } = useAuth();
  
  const getStatusColor = (status: string) => {
    if (status === 'Pendente') return 'bg-g-bg-tertiary text-g-text-secondary border border-g-border-default';
    if (status === 'Em Andamento') return 'bg-g-accent/10 text-g-text-primary border border-g-accent/20';
    if (status === 'Concluído') return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
    
    // Fallback for custom statuses
    return 'bg-g-bg-tertiary text-g-text-secondary border border-g-border-default';
  };

  const prioridadeStyles: Record<string, { backgroundColor: string; color: string; borderColor: string }> = {
    'Crítica': { backgroundColor: '#3D0E0E', color: '#F47070', borderColor: '#6B1C1C' },
    'Alta': { backgroundColor: '#2E1E00', color: '#F4A830', borderColor: '#5C3C00' },
    'Média': { backgroundColor: '#1A1600', color: '#F4C430', borderColor: '#3D3000' },
    'Baixa': { backgroundColor: '#1A1A1A', color: '#888884', borderColor: '#2A2A2A' }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="bg-g-bg-secondary/40 rounded-xl overflow-hidden border border-g-border-default shadow-none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-g-border-default">
            <thead className="bg-g-bg-tertiary/75">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-g-text-secondary uppercase tracking-wider font-sans border-b border-g-border-default animate-none shadow-none">Demanda</th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-g-text-secondary uppercase tracking-wider font-sans border-b border-g-border-default animate-none shadow-none">Solicitante</th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-g-text-secondary uppercase tracking-wider font-sans border-b border-g-border-default animate-none shadow-none">Time do Solicitante</th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-g-text-secondary uppercase tracking-wider font-sans border-b border-g-border-default animate-none shadow-none">Time Destino</th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-g-text-secondary uppercase tracking-wider font-sans border-b border-g-border-default animate-none shadow-none">Responsáveis</th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-g-text-secondary uppercase tracking-wider font-sans border-b border-g-border-default animate-none shadow-none">Status</th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-g-text-secondary uppercase tracking-wider font-sans border-b border-g-border-default animate-none shadow-none">Prioridade</th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-g-text-secondary uppercase tracking-wider font-sans border-b border-g-border-default animate-none shadow-none">Prazo (SLA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-g-border-default/60">
              {demandas.map((demanda) => {
                const creator = MOCK_USERS.find(u => u.uid === demanda.criado_por);
                const creatorName = creator ? creator.nome : "Desconhecido";
                const creatorInitials = creator 
                    ? creator.nome.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() 
                    : "RV";
                const creatorDept = creator ? creator.departamento : "TI";

                return (
                  <tr 
                    key={demanda.id} 
                    onClick={() => onRowClick(demanda.id)}
                    className="hover:bg-g-bg-secondary/40 cursor-pointer transition-colors text-g-text-primary"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-g-text-primary tracking-tight leading-snug">{demanda.titulo}</div>
                      <div className="text-xs text-g-text-tertiary font-mono mt-0.5">{demanda.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-g-bg-secondary border border-g-border-default flex items-center justify-center text-xs font-bold text-g-text-primary overflow-hidden select-none">
                          {creator?.avatarUrl ? (
                            <img 
                              src={creator.avatarUrl} 
                              alt={creatorName} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            creatorInitials
                          )}
                        </div>
                        <span className="font-medium text-g-text-primary">{creatorName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2.5 py-1 rounded-md text-xs uppercase font-mono font-bold bg-g-bg-secondary text-g-text-primary border border-g-border-default">
                        {creatorDept}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold font-mono text-g-text-primary uppercase">
                      {demanda.departamento_destino}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {(demanda.responsaveis_ids || []).length > 0 ? (
                          (demanda.responsaveis_ids || []).map(id => {
                            const u = MOCK_USERS.find(user => user.uid === id);
                            return (
                              <span key={id} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-g-bg-secondary text-g-text-primary border border-g-border-default" title={u ? `${u.nome} (${u.cargo})` : id}>
                                {u ? u.nome.split(" ")[0] : id}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-g-text-tertiary italic font-mono">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs uppercase tracking-wider leading-none font-bold rounded-md border ${getStatusColor(demanda.status)}`}>
                        {demanda.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span 
                        className="px-2.5 py-0.5 rounded text-xs font-bold font-sans uppercase tracking-wider border inline-block text-center"
                        style={prioridadeStyles[demanda.prioridade] || prioridadeStyles['Baixa']}
                      >
                        {demanda.prioridade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-g-text-secondary font-mono">
                      {format(new Date(demanda.prazo_sla), "dd/MM/yyyy")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
