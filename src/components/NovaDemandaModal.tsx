import React, { useState } from "react";
import { useDatabase } from "../context/DatabaseContext";
import { useAuth } from "../context/AuthContext";
import { MOCK_USERS } from "../data";
import { Departamento, Prioridade } from "../types";
import { X, Sparkles, AlertCircle, HelpCircle } from "lucide-react";
import { addDays } from "date-fns";

export function NovaDemandaModal({ onClose }: { onClose: () => void }) {
  const { addDemanda } = useDatabase();
  const { currentUser } = useAuth();
  
  // Segmented control state: "manual" or "ia"
  const [activeTab, setActiveTab] = useState<"manual" | "ia">("manual"); // Preenchimento manual por padrão
  
  // Base State for form fields (shared or synced)
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [departamento, setDepartamento] = useState<Departamento>(currentUser?.departamento || "TI");
  const [prioridade, setPrioridade] = useState<Prioridade>("Média");
  const [responsavelId, setResponsavelId] = useState("");
  const [prazoSla, setPrazoSla] = useState(addDays(new Date(), 3).toISOString().split('T')[0]);
  
  // IA State
  const [semTituloIA, setSemTituloIA] = useState(true); // If true, is option "Não quero preencher o título"
  const [loadingIA, setLoadingIA] = useState(false);
  const [erroIA, setErroIA] = useState("");
  const [justificativaDepto, setJustificativaDepto] = useState("");
  const [justificativaPrioridade, setJustificativaPrioridade] = useState("");
  const [iaConsultada, setIaConsultada] = useState(false);

  const handleTriagemIA = async () => {
    if (!descricao.trim()) {
      setErroIA("Por favor, preencha o campo de descrição primeiro para que a IA possa analisar e sugerir a triagem.");
      return;
    }

    setLoadingIA(true);
    setErroIA("");

    try {
      // If user chose not to fill the title, send empty string
      const tituloPayload = semTituloIA ? "" : titulo;

      const webhookUrl = import.meta.env.VITE_WEBHOOK_IA_URL || "https://rianlabs.app.n8n.cloud/webhook/d7657715-4c14-4bf7-a4e9-52f163c2eb7c";

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo: tituloPayload,
          descricao: descricao
        })
      });

      if (!response.ok) {
        let errorMessage = "Não foi possível conectar com o serviço de Triagem. Verifique sua conexão ou tente novamente.";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errorMessage = errData.error;
          }
        } catch (e) {
          errorMessage = `Erro de comunicação com o serviço (Status ${response.status}).`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const payload = result.data ? result.data : result;
      if (payload && (payload.titulo_sugerido || payload.departamento_destino)) {
        // Rule 1: preencher automaticamente o campo título com titulo_sugerido, apenas se o campo título estiver vazio;
        if (payload.titulo_sugerido && (!titulo.trim() || semTituloIA)) {
          setTitulo(payload.titulo_sugerido);
        }

        // Rule 2: preencher automaticamente o campo departamento_destino com departamento_destino;
        if (payload.departamento_destino) {
          const depto = payload.departamento_destino;
          if (["TI", "RH", "Marketing", "Financeiro"].includes(depto)) {
            setDepartamento(depto as Departamento);
          }
        }

        // Rule 3: preencher automaticamente o campo prioridade com prioridade;
        if (payload.prioridade) {
          const prio = payload.prioridade;
          if (["Baixa", "Média", "Alta"].includes(prio)) {
            setPrioridade(prio as Prioridade);
          }
        }

        // Rule 4: exibir um card abaixo do botão com as justificativas
        setJustificativaDepto(payload.departamento_justificativa || "");
        setJustificativaPrioridade(payload.prioridade_justificativa || "");
        setIaConsultada(true);
      } else {
        throw new Error(result.error || "A triagem da IA falhou em retornar os dados esperados.");
      }
    } catch (err: any) {
      console.error("AI Triagem flow error:", err);
      setErroIA(err?.message || "Ocorreu um erro no serviço de Triagem Inteligente. Você pode preencher os detalhes manualmente logo abaixo.");
    } finally {
      setLoadingIA(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const responsaveis_ids = (departamento === currentUser?.departamento && responsavelId) ? [responsavelId] : [];
    
    // Add demand
    addDemanda({
      titulo: titulo.trim() || `Demanda sobre ${descricao.slice(0, 30)}...`,
      descricao,
      departamento_destino: departamento,
      prioridade,
      prazo_sla: new Date(prazoSla).toISOString(),
      responsaveis_ids
    }, justificativaDepto || justificativaPrioridade ? `Sugerido por IA. Setor: ${justificativaDepto || 'N/A'}. Prioridade: ${justificativaPrioridade || 'N/A'}` : undefined);
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-in fade-in duration-200" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop overlay */}
        <div className="fixed inset-0 bg-[#000000]/75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-g-bg-primary rounded-xl text-left overflow-hidden shadow-none transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-g-border-emphasis">
          
          <form onSubmit={handleSubmit}>
            <div className="px-5 pt-5 pb-4 text-g-text-primary">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-g-text-primary flex items-center gap-1.5 font-sans" id="modal-title">
                  Nova Demanda
                </h3>
                <button type="button" onClick={onClose} className="text-g-text-tertiary hover:text-g-text-primary transition-colors cursor-pointer focus:outline-none">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* TABS SELECTOR */}
              <div className="flex border-b border-g-border-default mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("ia");
                    setErroIA("");
                  }}
                  className={`flex-1 pb-2.5 text-center text-sm font-medium border-b-2 cursor-pointer transition-all flex items-center justify-center gap-1.5 focus:outline-none ${
                    activeTab === "ia"
                      ? "border-g-accent text-g-accent font-semibold"
                      : "border-transparent text-g-text-secondary hover:text-g-text-primary"
                  }`}
                >
                  <Sparkles className="h-4 w-4 text-g-accent animate-pulse" />
                  Ajuda da IA
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("manual");
                    setErroIA("");
                  }}
                  className={`flex-1 pb-2.5 text-center text-sm font-medium border-b-2 cursor-pointer transition-all focus:outline-none ${
                    activeTab === "manual"
                      ? "border-g-accent text-g-accent font-semibold"
                      : "border-transparent text-g-text-secondary hover:text-g-text-primary"
                  }`}
                >
                  Preenchimento Manual
                </button>
              </div>

              {/* FLOW 1: AI ASSISTANCE TAB */}
              {activeTab === "ia" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Descrição */}
                  <div>
                    <label htmlFor="descricao_ia" className="block text-sm font-medium text-g-text-secondary">
                      O que está acontecendo? (Descrição para a IA)
                    </label>
                    <textarea
                      id="descricao_ia"
                      required
                      rows={4}
                      value={descricao}
                      onChange={e => setDescricao(e.target.value)}
                      className="mt-1 block w-full border border-g-border-default rounded-md pb-2 pt-2 px-3 focus:outline-none focus:ring-1 focus:ring-g-accent focus:border-g-accent sm:text-sm bg-g-bg-secondary text-g-text-primary resize-none shadow-none font-sans"
                      placeholder="Ex: O faturamento das notas em lote está dando erro de timeout na SEFAZ..."
                    />
                  </div>

                  {/* Título com Opção de Não Preencher */}
                  <div className="p-3 bg-g-bg-secondary/60 rounded-lg border border-g-border-default/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-g-text-secondary">
                        Título da Demanda
                      </span>
                      <label className="inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={semTituloIA}
                          onChange={(e) => setSemTituloIA(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="relative w-8 h-4 bg-g-border-emphasis peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-g-accent"></div>
                        <span className="ms-1.5 text-xs text-g-text-secondary">Não quero preencher</span>
                      </label>
                    </div>

                    {!semTituloIA ? (
                      <input
                        type="text"
                        required={!semTituloIA}
                        value={titulo}
                        onChange={e => setTitulo(e.target.value)}
                        className="block w-full border border-g-border-default rounded-md pb-2 pt-2 px-3 focus:outline-none focus:ring-1 focus:ring-g-accent focus:border-g-accent sm:text-sm bg-g-bg-primary text-g-text-primary shadow-none font-sans animate-in fade-in duration-150"
                        placeholder="Digite o título manualmente..."
                      />
                    ) : (
                      <p className="text-[11px] text-g-text-tertiary italic flex items-center gap-1">
                        <Sparkles className="h-3 w-3 shrink-0 text-g-accent" />
                        A Gaudium IA irá fornecer um título automaticamente
                      </p>
                    )}
                  </div>

                  {/* Botão Triagem com IA */}
                  <div>
                    <button
                      type="button"
                      onClick={handleTriagemIA}
                      disabled={loadingIA}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-g-accent/30 px-4 py-2.5 bg-g-accent/10 hover:bg-g-accent/20 text-g-accent text-sm font-semibold transition-all shadow-none cursor-pointer focus:outline-none disabled:opacity-75"
                    >
                      {loadingIA ? (
                        <>
                          <div className="h-4 w-4 rounded-full border-2 border-g-accent/30 border-t-g-accent animate-spin" />
                          <span>Consultando IA da Gaudium Labs...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4.5 w-4.5 text-g-accent animate-pulse" />
                          <span>Triagem com IA</span>
                        </>
                      )}
                    </button>

                    {/* Mensagem de Erro de IA Amigável */}
                    {erroIA && (
                      <div className="mt-2.5 p-3 rounded-lg bg-g-destructive/10 border border-g-destructive/20 text-g-destructive text-xs flex items-start gap-1.5 animate-in fade-in duration-150">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{erroIA}</span>
                      </div>
                    )}

                    {/* Card de Justificativas */}
                    {(justificativaDepto || justificativaPrioridade) && (
                      <div className="mt-2.5 p-3.5 rounded-lg bg-g-accent/5 border border-g-accent/20 space-y-2.5 text-g-text-primary animate-in fade-in duration-200">
                        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-g-accent">
                          <Sparkles className="h-3.5 w-3.5" />
                          Justificativas da IA
                        </div>
                        <div className="space-y-2 text-xs">
                          {justificativaDepto && (
                            <div>
                              <span className="font-semibold text-g-text-secondary">Análise do Setor:</span>
                              <p className="text-g-text-primary mt-0.5">{justificativaDepto}</p>
                            </div>
                          )}
                          {justificativaPrioridade && (
                            <div className={justificativaDepto ? "pt-2 border-t border-g-border-default/50" : ""}>
                              <span className="font-semibold text-g-text-secondary">Análise de Prioridade:</span>
                              <p className="text-g-text-primary mt-0.5">{justificativaPrioridade}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Resultados Sugeridos pela IA, mantidos editáveis */}
                  {iaConsultada && (
                    <div className="p-3 bg-g-accent/5 rounded-lg border border-g-accent/15 space-y-3 animate-in slide-in-from-top-2 duration-300">
                      <div className="text-[11px] font-semibold text-g-text-tertiary uppercase tracking-wider">
                        Campos Sugeridos (Editáveis se desejar)
                      </div>
                      
                      <div>
                        <label htmlFor="titulo_ia_suge" className="block text-xs font-medium text-g-text-secondary">Título formatado pela IA</label>
                        <input
                          type="text"
                          id="titulo_ia_suge"
                          value={titulo}
                          onChange={e => setTitulo(e.target.value)}
                          className="mt-1 block w-full border border-g-border-default rounded-md pb-1.5 pt-1.5 px-2.5 text-xs bg-g-bg-secondary text-g-text-primary min-h-[32px] focus:outline-none font-sans"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="depto_ia_suge" className="block text-xs font-medium text-g-text-secondary">Setor Destino</label>
                          <select
                            id="depto_ia_suge"
                            value={departamento}
                            onChange={e => setDepartamento(e.target.value as Departamento)}
                            className="mt-1 block w-full bg-g-bg-secondary border border-g-border-default rounded-md py-1.5 px-2 text-xs text-g-text-primary cursor-pointer focus:outline-none"
                          >
                            <option value="TI">TI</option>
                            <option value="RH">RH</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Financeiro">Financeiro</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="prio_ia_suge" className="block text-xs font-medium text-g-text-secondary">Prioridade</label>
                          <select
                            id="prio_ia_suge"
                            value={prioridade}
                            onChange={e => setPrioridade(e.target.value as Prioridade)}
                            className="mt-1 block w-full bg-g-bg-secondary border border-g-border-default rounded-md py-1.5 px-2 text-xs text-g-text-primary cursor-pointer focus:outline-none"
                          >
                            <option value="Baixa">Baixa</option>
                            <option value="Média">Média</option>
                            <option value="Alta">Alta</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="prazoSla_ia_suge" className="block text-xs font-medium text-g-text-secondary">Prazo Sugerido (SLA)</label>
                        <input
                          type="date"
                          id="prazoSla_ia_suge"
                          value={prazoSla}
                          onChange={e => setPrazoSla(e.target.value)}
                          className="mt-1 block w-full border border-g-border-default rounded-md py-1.5 px-2 text-xs bg-g-bg-secondary text-g-text-primary focus:outline-none font-sans"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FLOW 2: MANUAL DEMAND TAB */}
              {activeTab === "manual" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Título */}
                  <div>
                    <label htmlFor="titulo_manual" className="block text-sm font-medium text-g-text-secondary">Título</label>
                    <input
                      type="text"
                      id="titulo_manual"
                      required
                      value={titulo}
                      onChange={e => setTitulo(e.target.value)}
                      className="mt-1 block w-full border border-g-border-default rounded-md pb-2 pt-2 px-3 focus:outline-none focus:ring-1 focus:ring-g-accent focus:border-g-accent sm:text-sm bg-g-bg-secondary text-g-text-primary shadow-none font-sans"
                      placeholder="Resumo claro da demanda"
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <label htmlFor="descricao_manual" className="block text-sm font-medium text-g-text-secondary">Descrição</label>
                    <textarea
                      id="descricao_manual"
                      required
                      rows={4}
                      value={descricao}
                      onChange={e => setDescricao(e.target.value)}
                      className="mt-1 block w-full border border-g-border-default rounded-md pb-2 pt-2 px-3 focus:outline-none focus:ring-1 focus:ring-g-accent focus:border-g-accent sm:text-sm bg-g-bg-secondary text-g-text-primary resize-none shadow-none font-sans"
                      placeholder="Descreva detalhadamente as instruções..."
                    />
                  </div>

                  {/* Departamento & Prioridade */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="depto_man" className="block text-sm font-medium text-g-text-secondary">Para Setor</label>
                      <select
                        id="depto_man"
                        value={departamento}
                        onChange={e => setDepartamento(e.target.value as Departamento)}
                        className="mt-1 block w-full bg-g-bg-secondary border border-g-border-default rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-g-accent focus:border-g-accent sm:text-sm text-g-text-primary cursor-pointer shadow-none"
                      >
                        <option value="TI">TI</option>
                        <option value="RH">RH</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Financeiro">Financeiro</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="prioridade_man" className="block text-sm font-medium text-g-text-secondary">Prioridade</label>
                      <select
                        id="prioridade_man"
                        value={prioridade}
                        onChange={e => setPrioridade(e.target.value as Prioridade)}
                        className="mt-1 block w-full bg-g-bg-secondary border border-g-border-default rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-g-accent focus:border-g-accent sm:text-sm text-g-text-primary cursor-pointer shadow-none"
                      >
                        <option value="Baixa">Baixa</option>
                        <option value="Média">Média</option>
                        <option value="Alta">Alta</option>
                      </select>
                    </div>
                  </div>

                  {/* SLA */}
                  <div>
                    <label htmlFor="prazoSla_man" className="block text-sm font-medium text-g-text-secondary">Prazo Sugerido (SLA)</label>
                    <input
                      type="date"
                      id="prazoSla_man"
                      required
                      value={prazoSla}
                      onChange={e => setPrazoSla(e.target.value)}
                      className="mt-1 block w-full border border-g-border-default rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-g-accent focus:border-g-accent sm:text-sm bg-g-bg-secondary text-g-text-primary shadow-none font-sans"
                    />
                  </div>

                  {/* Atribuição de Responsável se for do mesmo setor */}
                  {departamento === currentUser?.departamento && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <label htmlFor="resp_man" className="block text-sm font-medium text-g-text-secondary">Atribuir Responsável (Opcional)</label>
                      <select
                        id="resp_man"
                        value={responsavelId}
                        onChange={e => setResponsavelId(e.target.value)}
                        className="mt-1 block w-full bg-g-bg-secondary border border-g-border-default rounded-md py-2 px-3 focus:outline-none"
                      >
                        <option value="">Sem Atribuição (deixar para o gestor)</option>
                        {MOCK_USERS.filter(u => u.departamento === currentUser?.departamento).map(u => (
                          <option key={u.uid} value={u.uid}>
                            {u.nome} ({u.cargo})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-g-border-default bg-g-bg-secondary/40">
              <button
                type="submit"
                className="w-full inline-flex justify-center items-center gap-1.5 rounded-md border border-transparent px-4 py-2 bg-g-accent text-base font-medium text-g-accent-text hover:bg-g-accent-hover sm:ml-3 sm:w-auto sm:text-sm shadow-none cursor-pointer"
              >
                Criar Demanda
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-g-border-default px-4 py-2 bg-g-bg-secondary text-base font-medium text-g-text-primary hover:bg-g-bg-tertiary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm shadow-none cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
