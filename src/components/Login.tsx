import React from "react";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";
import { MOCK_USERS } from "../data";
import { GaudiumLogo } from "./GaudiumLogo";

export function Login() {
  const { loginAs, isLoading } = useAuth();

  const getInitials = (nome: string) => {
    return nome
      .split(" ")
      .map(n => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-g-bg-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors text-g-text-primary">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="flex justify-center mb-4">
          <GaudiumLogo className="w-16 h-16" />
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-g-text-primary tracking-tight">
          Gaudium Labs
        </h2>
        <p className="mt-2 text-center text-sm text-g-text-tertiary font-mono text-xs uppercase tracking-wider">
          Controle Interno de Demandas
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-g-bg-secondary py-6 px-4 sm:rounded-xl sm:px-8 border border-g-border-default shadow-none">
          <div className="space-y-6">
            <p className="text-xs font-semibold text-g-text-tertiary text-center uppercase font-mono tracking-wider mb-2">
              Simulação de autenticação
            </p>

            {/* Seção Gestores */}
            <div>
              <h3 className="text-xs font-bold text-g-accent uppercase tracking-widest mb-3 flex items-center gap-1">
                Gestores & Diretores
              </h3>
              <div className="space-y-2">
                {MOCK_USERS.filter(u => u.cargo.toLowerCase().includes("gestor") || u.cargo.toLowerCase().includes("diretor")).map((user) => (
                  <button
                    key={user.uid}
                    onClick={() => loginAs(user.uid)}
                    disabled={isLoading}
                    className="w-full flex justify-between items-center px-4 py-2.5 border border-g-border-default rounded-xl text-sm font-medium text-g-text-secondary bg-g-bg-primary hover:bg-g-bg-tertiary transition-all cursor-pointer shadow-none focus:outline-none"
                  >
                    <div className="flex items-center space-x-3 text-left">
                      <div className="w-8 h-8 rounded-full bg-g-bg-secondary text-g-text-primary font-bold flex items-center justify-center text-xs border border-g-border-default shadow-none overflow-hidden select-none">
                        {user.avatarUrl ? (
                          <img 
                            src={user.avatarUrl} 
                            alt={user.nome} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          getInitials(user.nome)
                        )}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-g-text-primary leading-tight text-xs">{user.nome}</span>
                        <span className="text-[10px] text-g-text-tertiary font-mono">{user.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded-md border bg-g-accent/10 text-g-accent border-g-accent/30">
                        {user.cargo}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-g-border-default/60" />
              </div>
              <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-widest text-g-text-tertiary font-mono">
                <span className="px-2 bg-g-bg-secondary">Operacional</span>
              </div>
            </div>

            {/* Seção Colaboradores */}
            <div>
              <h3 className="text-xs font-bold text-g-text-secondary uppercase tracking-widest mb-3 flex items-center gap-1">
                Colaboradores
              </h3>
              <div className="space-y-2">
                {MOCK_USERS.filter(u => !u.cargo.toLowerCase().includes("gestor") && !u.cargo.toLowerCase().includes("diretor")).map((user) => (
                  <button
                    key={user.uid}
                    onClick={() => loginAs(user.uid)}
                    disabled={isLoading}
                    className="w-full flex justify-between items-center px-4 py-2.5 border border-g-border-default rounded-xl text-sm font-medium text-g-text-secondary bg-g-bg-primary hover:bg-g-bg-tertiary transition-all cursor-pointer shadow-none focus:outline-none"
                  >
                    <div className="flex items-center space-x-3 text-left">
                      <div className="w-8 h-8 rounded-full bg-g-bg-secondary text-g-text-primary font-bold flex items-center justify-center text-xs border border-g-border-default shadow-none overflow-hidden select-none">
                        {user.avatarUrl ? (
                          <img 
                            src={user.avatarUrl} 
                            alt={user.nome} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          getInitials(user.nome)
                        )}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-g-text-primary leading-tight text-xs">{user.nome}</span>
                        <span className="text-[10px] text-g-text-tertiary font-mono">{user.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded-md border bg-g-bg-tertiary text-g-text-secondary border-g-border-default">
                        {user.cargo === "Estagiário de Automação e Inovação" ? "Estág. Automação & Inov." : user.cargo}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
