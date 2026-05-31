import React from "react";
import { useDatabase } from "../context/DatabaseContext";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, CheckCircle, Info, UserPlus, FileText, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function NotificacoesList() {
  const { notificacoes, markNotificacaoAsRead, clearAllNotificacoes } = useDatabase();
  const { currentUser } = useAuth();

  const userNotificacoes = notificacoes
    .filter(n => n.usuario_id === currentUser?.uid)
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

  if (userNotificacoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-g-bg-secondary rounded-full flex items-center justify-center mb-4">
          <Bell className="w-8 h-8 text-g-text-tertiary" />
        </div>
        <h3 className="text-sm font-bold text-g-text-primary mb-1">Nenhuma notificação</h3>
        <p className="text-xs text-g-text-secondary">Você não possui notificações no momento.</p>
      </div>
    );
  }

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'demanda_criada': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'responsavel_atribuido': return <UserPlus className="w-4 h-4 text-amber-500" />;
      case 'status_alterado': return <Info className="w-4 h-4 text-purple-500" />;
      case 'demanda_concluida': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default: return <Bell className="w-4 h-4 text-g-text-secondary" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-g-text-secondary" />
          <h2 className="text-lg font-bold text-g-text-primary">Notificações</h2>
        </div>
        
        {userNotificacoes.length > 0 && (
          <button
            onClick={clearAllNotificacoes}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-g-text-tertiary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excluir todas</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {userNotificacoes.map(notif => (
          <div 
            key={notif.id} 
            className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
              notif.lida 
                ? "bg-g-bg-secondary/40 border-g-border-default opacity-80" 
                : "bg-g-bg-secondary border-g-accent/40 shadow-sm"
            }`}
          >
            <div className={`mt-0.5 p-2 rounded-full ${notif.lida ? 'bg-g-bg-primary' : 'bg-g-bg-primary border border-g-accent/20'}`}>
              {getIcon(notif.tipo)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-1">
                <h4 className={`text-sm tracking-wide ${notif.lida ? 'font-semibold text-g-text-secondary' : 'font-bold text-g-text-primary'}`}>
                  {notif.titulo}
                </h4>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] uppercase font-bold text-g-text-tertiary">
                    {format(parseISO(notif.criado_em), "dd MMM, HH:mm", { locale: ptBR })}
                  </span>
                  {!notif.lida && (
                    <button 
                      onClick={() => markNotificacaoAsRead(notif.id)}
                      className="text-[10px] font-bold uppercase tracking-wider text-g-accent hover:text-g-accent-hover transition-colors"
                      title="Marcar como lida"
                    >
                      Marcar lida
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-g-text-secondary leading-relaxed">
                {notif.mensagem}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
