import React, { useMemo, useState } from "react";
import { useDatabase } from "../context/DatabaseContext";
import { useAuth } from "../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { Sparkles, BarChart3, ChevronDown, ChevronUp } from "lucide-react";

export function StatusChart() {
  const { currentUser } = useAuth();
  const { demandas, statuses } = useDatabase();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Visível apenas para Gestores e Diretores
  const isGestorOuDiretor = currentUser?.cargo.toLowerCase().includes("gestor") || 
                            currentUser?.cargo.toLowerCase().includes("diretor");

  if (!isGestorOuDiretor) return null;

  const userDepto = currentUser?.departamento;

  // Filtra APENAS as demandas do departamento do usuário (sua área / seu setor)
  const relevantDemandas = useMemo(() => {
    return demandas.filter(d => d.departamento_destino === userDepto);
  }, [demandas, userDepto]);

  const chartData = useMemo(() => {
    // Conta as demandas por status
    const counts = statuses.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {} as Record<string, number>);

    relevantDemandas.forEach(d => {
      if (counts[d.status] !== undefined) {
        counts[d.status]++;
      } else {
        counts[d.status] = 1;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [relevantDemandas, statuses]);

  const totalDemandas = relevantDemandas.length;
  const pendentesCount = relevantDemandas.filter(d => d.status === "Pendente").length;
  const emAndamentoCount = relevantDemandas.filter(d => d.status === "Em Andamento").length;
  const concluidoCount = relevantDemandas.filter(d => d.status === "Concluído").length;

  // Cores personalizadas premium para cada status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pendente":
        return "var(--color-slate-400, #94a3b8)";
      case "Em Andamento":
        return "var(--color-g-accent, #7c3aed)";
      case "Concluído":
        return "var(--color-emerald-500, #10b981)";
      default:
        return "var(--color-indigo-400, #818cf8)";
    }
  };

  // Custom high-fidelity Tooltip styling
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-g-bg-secondary p-3 border border-g-border-emphasis rounded-lg text-xs shadow-md font-sans">
          <p className="font-bold text-g-text-primary mb-1">{data.name}</p>
          <div className="flex items-center gap-1.5 font-semibold">
            <span 
              className="w-2 h-2 rounded-full inline-block" 
              style={{ backgroundColor: getStatusColor(data.name) }}
            />
            <span className="text-g-text-secondary">Demandas:</span>
            <span className="text-g-text-primary">{data.value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isCollapsed) {
    return (
      <div className="bg-g-bg-secondary/40 border border-g-border-default rounded-xl p-3.5 mb-8 flex justify-between items-center animate-in fade-in duration-200">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-g-accent/10 border border-g-accent/25 rounded-lg">
            <BarChart3 className="w-4 h-4 text-g-accent" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="text-xs font-bold text-g-text-primary font-sans">
              Visão Geral das Demandas
            </span>
            <span className="hidden sm:inline text-g-text-tertiary text-xs">•</span>
            <span className="text-[11px] text-g-text-secondary font-medium">
              Setor: {userDepto} • Total: <span className="font-bold text-g-text-primary font-mono">{totalDemandas}</span> (Fila: <span className="font-bold text-g-text-primary font-mono">{pendentesCount}</span>, Concluído: <span className="font-bold text-g-text-primary font-mono">{concluidoCount}</span>)
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsCollapsed(false)}
          className="px-3 py-1.5 bg-g-bg-secondary hover:bg-g-bg-tertiary text-g-text-primary border border-g-border-default rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer focus:outline-none flex items-center gap-1.5"
        >
          <span>Expandir</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-g-bg-secondary/40 border border-g-border-default rounded-xl p-5 mb-8 animate-in fade-in slide-in-from-top-3 duration-300 relative">
      {/* Collapse Action Trigger */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setIsCollapsed(true)}
          className="px-3 py-1.5 bg-g-bg-primary hover:bg-g-bg-secondary text-g-text-primary border border-g-border-default rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer focus:outline-none flex items-center gap-1.5"
        >
          <span>Recolher</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left column - KPI stats summary */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-g-accent/10 border border-g-accent/25 rounded-lg">
              <BarChart3 className="w-5 h-5 text-g-accent" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-g-text-primary tracking-wide flex items-center gap-1.5 font-sans">
                Visão Geral das Demandas
              </h3>
              <p className="text-[11px] text-g-text-tertiary font-medium">
                Setor: {userDepto} • Gestão & Planejamento
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="bg-g-bg-primary border border-g-border-default/60 rounded-lg p-3 text-center">
              <span className="text-[10px] font-bold text-g-text-secondary uppercase tracking-wider block mb-1">
                Total
              </span>
              <span className="text-xl font-bold text-g-text-primary font-mono block">
                {totalDemandas}
              </span>
            </div>
            
            <div className="bg-g-bg-primary border border-g-border-default/60 rounded-lg p-3 text-center border-l-2 border-l-g-accent/50">
              <span className="text-[10px] font-bold text-g-text-secondary uppercase tracking-wider block mb-1">
                Em Fila
              </span>
              <span className="text-xl font-bold text-g-text-primary font-mono block">
                {pendentesCount}
              </span>
            </div>

            <div className="bg-g-bg-primary border border-g-border-default/60 rounded-lg p-3 text-center border-l-2 border-l-emerald-500/50">
              <span className="text-[10px] font-bold text-g-text-secondary uppercase tracking-wider block mb-1">
                Concluído
              </span>
              <span className="text-xl font-bold text-g-text-primary font-mono block">
                {concluidoCount}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-g-text-secondary flex items-center gap-1.5 leading-relaxed bg-g-bg-secondary rounded-lg p-2.5 border border-g-border-default/55">
            <Sparkles className="w-3.5 h-3.5 text-g-accent shrink-0 animate-pulse" />
            <span>
              Use o quadro kanban abaixo para arrastar e gerenciar as prioridades em tempo real.
            </span>
          </div>
        </div>

        {/* Right column - Recharts Bar Chart */}
        <div className="lg:col-span-8 bg-g-bg-primary border border-g-border-default/60 rounded-lg p-4 h-[180px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-g-border-default, rgba(255,255,255,0.05))" />
              <XAxis 
                dataKey="name" 
                stroke="var(--color-g-text-secondary, #94a3b8)" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="var(--color-g-text-secondary, #94a3b8)" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255, 255, 255, 0.02)" }} />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={45}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getStatusColor(entry.name)} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
