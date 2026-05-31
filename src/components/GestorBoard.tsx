import React, { useState } from "react";
import { useDatabase } from "../context/DatabaseContext";
import { useAuth } from "../context/AuthContext";
import { DndContext, DragEndEvent, closestCorners, useDroppable, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Demanda, Status } from "../types";
import { MOCK_USERS } from "../data";
import { format } from "date-fns";
import { GripVertical, Pencil, Trash2, Check, X, Plus } from "lucide-react";

export function GestorBoard({ demandas, onCardClick }: { demandas: Demanda[], onCardClick: (demandaId: string) => void }) {
  const { currentUser } = useAuth();
  const { updateDemandaStatus, statuses, addStatus, editStatus, deleteStatus } = useDatabase();

  const [isAddingStatus, setIsAddingStatus] = useState(false);
  const [newStatusName, setNewStatusName] = useState("");

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  });
  
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 150,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id.toString();
    const overId = over.id.toString();

    const demanda = demandas.find(d => d.id === activeId);
    if (!demanda) return;

    // Enforce canUpdate permission check on drag
    const isResponsavelOfDemanda = (demanda.responsaveis_ids || []).includes(currentUser?.uid || "");
    const isUserInTargetDepartment = currentUser?.departamento === demanda.departamento_destino;
    const isGestorOuDiretorOfTargetDepartment = isUserInTargetDepartment && (currentUser?.cargo?.toLowerCase().includes("gestor") || currentUser?.cargo?.toLowerCase().includes("diretor"));
    const canUpdate = isGestorOuDiretorOfTargetDepartment || isResponsavelOfDemanda;

    if (!canUpdate) return;

    let targetStatus: Status | undefined;

    if (statuses.includes(overId)) {
      targetStatus = overId;
    } else {
      const overDemanda = demandas.find(d => d.id === overId);
      if (overDemanda) {
        targetStatus = overDemanda.status;
      }
    }

    if (targetStatus && demanda.status !== targetStatus) {
      updateDemandaStatus(activeId, targetStatus);
    }
  };

  const handleAddStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStatusName.trim()) {
      addStatus(newStatusName.trim());
      setNewStatusName("");
      setIsAddingStatus(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 gap-6 overflow-x-auto pb-6 items-start w-full">
          {statuses.map(status => {
            const columnDemandas = demandas.filter(d => d.status === status);
            return (
              <BoardColumn 
                key={status} 
                status={status} 
                demandas={columnDemandas} 
                onCardClick={onCardClick}
                onEditStatus={editStatus}
                onDeleteStatus={deleteStatus}
              />
            );
          })}

          {/* New Status Dynamic Column Trigger */}
          <div className="w-80 min-w-[20rem] flex-shrink-0">
            {isAddingStatus ? (
              <form 
                onSubmit={handleAddStatusSubmit}
                className="bg-g-bg-secondary border border-g-border-default p-4 rounded-xl space-y-3 shadow-none"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-g-text-secondary uppercase tracking-wider font-mono">Novo Status</span>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingStatus(false)}
                    className="text-g-text-tertiary hover:text-g-text-primary transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Ex: Em Homologação..."
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  className="w-full bg-g-bg-primary border border-g-border-default rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-g-accent focus:outline-none text-g-text-primary font-medium shadow-none font-sans"
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full bg-g-accent text-g-accent-text font-bold text-xs uppercase tracking-wider py-2 rounded-lg hover:bg-g-accent-hover transition-colors cursor-pointer shadow-none"
                >
                  Criar Coluna
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingStatus(true)}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-g-border-default hover:border-g-border-emphasis hover:bg-g-bg-secondary rounded-xl py-4 text-g-text-tertiary hover:text-g-text-secondary transition-all font-semibold text-xs uppercase tracking-wider font-mono cursor-pointer shadow-none"
              >
                <Plus className="w-4 h-4" />
                Adicionar Coluna
              </button>
            )}
          </div>
        </div>
      </DndContext>
    </div>
  );
}

const BoardColumn: React.FC<{ 
  status: Status, 
  demandas: Demanda[], 
  onCardClick: (id: string) => void,
  onEditStatus: (oldName: string, newName: string) => void,
  onDeleteStatus: (name: string) => void
}> = ({ status, demandas, onCardClick, onEditStatus, onDeleteStatus }) => {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(status);

  const handleSave = () => {
    if (editedName.trim() && editedName.trim() !== status) {
      onEditStatus(status, editedName.trim());
    }
    setIsEditing(false);
  };

  const bgColors: Record<string, string> = {
    'Pendente': 'bg-g-bg-secondary border border-g-border-default',
    'Em Andamento': 'bg-g-bg-secondary border border-g-border-default',
    'Concluído': 'bg-g-bg-secondary border border-g-border-default'
  };

  const columnBg = bgColors[status] || 'bg-g-bg-secondary border border-g-border-default';

  const headerColors: Record<string, string> = {
    'Pendente': 'text-g-text-secondary',
    'Em Andamento': 'text-g-accent',
    'Concluído': 'text-emerald-500'
  };

  const headerCol = headerColors[status] || 'text-g-text-primary';

  return (
    <div className={`flex flex-col w-80 min-w-[20rem] flex-shrink-0 rounded-xl p-4 transition-all duration-200 shadow-none ${columnBg}`}>
      <div className="flex items-center justify-between mb-4 px-1 h-8">
        {isEditing ? (
          <div className="flex items-center gap-1.5 w-full">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="flex-grow bg-g-bg-primary border border-g-border-default rounded px-2 py-1 text-xs focus:outline-none font-bold text-g-text-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") {
                  setEditedName(status);
                  setIsEditing(false);
                }
              }}
            />
            <button 
              onClick={handleSave}
              className="p-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-550 rounded cursor-pointer"
            >
              <Check className="w-3 h-3" />
            </button>
            <button 
              onClick={() => {
                setEditedName(status);
                setIsEditing(false);
              }}
              className="p-1 bg-g-destructive/15 hover:bg-g-destructive/25 text-g-destructive rounded cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full group/title">
            <div className="flex items-center gap-2">
              <h3 className={`font-sans text-sm font-bold uppercase tracking-wider ${headerCol}`}>
                {status}
              </h3>
              <span className="text-xs font-sans font-bold bg-g-bg-tertiary border border-g-border-default text-g-text-secondary py-0.5 px-2 rounded-md">
                {demandas.length}
              </span>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover/title:opacity-100 transition-opacity">
              <button 
                onClick={() => {
                  setEditedName(status);
                  setIsEditing(true);
                }}
                className="p-1 hover:bg-g-bg-tertiary text-g-text-tertiary hover:text-g-text-primary rounded transition-colors cursor-pointer"
                title="Editar Nome do Status"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button 
                onClick={() => {
                  if (window.confirm(`Tem certeza que deseja excluir o status "${status}"? As tarefas deste status serão migradas.`)) {
                    onDeleteStatus(status);
                  }
                }}
                className="p-1 hover:bg-g-destructive/15 text-g-text-tertiary hover:text-g-destructive rounded transition-colors cursor-pointer"
                title="Excluir Coluna"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <SortableContext id={status} items={demandas.map(d => d.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex-grow space-y-3 min-h-[350px]">
          {demandas.map(demanda => (
            <SortableCard key={demanda.id} demanda={demanda} onClick={() => onCardClick(demanda.id)} />
          ))}
          {demandas.length === 0 && (
            <div className="h-32 border-2 border-dashed border-g-border-default rounded-xl flex items-center justify-center text-xs text-g-text-tertiary">
              Arraste tarefas aqui
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

const SortableCard: React.FC<{ demanda: Demanda, onClick: () => void }> = ({ demanda, onClick }) => {
  const { currentUser } = useAuth();
  const isResponsavelOfDemanda = (demanda.responsaveis_ids || []).includes(currentUser?.uid || "");
  const isUserInTargetDepartment = currentUser?.departamento === demanda.departamento_destino;
  const isGestorOuDiretorOfTargetDepartment = isUserInTargetDepartment && (currentUser?.cargo?.toLowerCase().includes("gestor") || currentUser?.cargo?.toLowerCase().includes("diretor"));
  const canDrag = isGestorOuDiretorOfTargetDepartment || isResponsavelOfDemanda;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: demanda.id,
    disabled: !canDrag
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const prioridadeStyles: Record<string, { backgroundColor: string; color: string; borderColor: string }> = {
    'Crítica': { backgroundColor: '#3D0E0E', color: '#F47070', borderColor: '#6B1C1C' },
    'Alta': { backgroundColor: '#2E1E00', color: '#F4A830', borderColor: '#5C3C00' },
    'Média': { backgroundColor: '#1A1600', color: '#F4C430', borderColor: '#3D3000' },
    'Baixa': { backgroundColor: '#1A1A1A', color: '#888884', borderColor: '#2A2A2A' }
  };

  const statusBorderColors: Record<string, string> = {
    'Pendente': 'border-l-4 border-l-g-text-tertiary',
    'Em Andamento': 'border-l-4 border-l-g-accent',
    'Concluído': 'border-l-4 border-l-emerald-500 opacity-85'
  };

  const borderCol = statusBorderColors[demanda.status] || 'border-l-4 border-l-g-border-emphasis';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-g-bg-primary border border-g-border-default p-4 rounded-xl hover:border-g-border-emphasis transition-all select-none group relative ${borderCol} shadow-none ${!canDrag ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
    >
      {canDrag && (
        <div className="absolute top-4 right-3 text-g-text-tertiary group-hover:text-g-text-secondary transition-colors">
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      )}
      <div className="pr-6">
        <div className="flex items-center gap-2 mb-2">
          <span 
            className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border text-center font-sans"
            style={prioridadeStyles[demanda.prioridade] || prioridadeStyles['Baixa']}
          >
            {demanda.prioridade}
          </span>
          <span className="text-xs text-g-text-secondary font-mono">SLA: {format(new Date(demanda.prazo_sla), "dd/MM")}</span>
        </div>
        <h4 className="font-semibold text-sm tracking-tight text-g-text-primary leading-tight mb-2 line-clamp-2">
          {demanda.titulo}
        </h4>
        <div className="flex flex-col gap-1 mt-2 md:mt-2.5 pt-2 border-t border-g-border-default">
          <div className="text-xs text-g-text-secondary font-mono">
            De: <span className="font-semibold text-g-text-primary">
              {(() => {
                const u = MOCK_USERS.find(user => user.uid === demanda.criado_por);
                return u ? `${u.nome} | ${u.departamento}` : "Desconhecido";
              })()}
            </span>
          </div>
          <div 
            className="text-xs text-g-text-secondary font-mono truncate" 
            title={(demanda.responsaveis_ids || []).map(id => {
              const u = MOCK_USERS.find(user => user.uid === id);
              return u ? `${u.nome} | ${u.departamento}` : id;
            }).join(", ") || "Sem atribuição"}
          >
            Para: <span className="font-semibold text-g-text-primary">
              {(demanda.responsaveis_ids || []).length > 0 
                ? (demanda.responsaveis_ids || []).map(id => {
                    const u = MOCK_USERS.find(user => user.uid === id);
                    return u ? `${u.nome} | ${u.departamento}` : id;
                  }).join(", ")
                : "Sem Atribuição"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
