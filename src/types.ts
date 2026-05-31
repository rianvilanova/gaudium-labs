export type Cargo = string;
export type Departamento = 'TI' | 'RH' | 'Marketing' | 'Financeiro';
export type Prioridade = 'Baixa' | 'Média' | 'Alta';
export type Status = string;

export interface User {
  uid: string;
  nome: string;
  email: string;
  cargo: Cargo;
  departamento: Departamento;
  avatarUrl?: string;
}

export interface Demanda {
  id: string;
  titulo: string;
  descricao: string;
  criado_em: string;
  criado_por: string;
  departamento_destino: Departamento;
  prioridade: Prioridade;
  status: Status;
  responsaveis_ids: string[];
  prazo_sla: string;
}

export type TipoNotificacao = 'demanda_criada' | 'responsavel_atribuido' | 'status_alterado' | 'demanda_concluida';

export interface Notificacao {
  id: string;
  usuario_id: string;
  titulo: string;
  mensagem: string;
  tipo: TipoNotificacao;
  lida: boolean;
  criado_em: string;
}

export interface HistoricoDemanda {
  id: string;
  demanda_id: string;
  descricao_acao: string;
  alterado_em: string;
  alterado_por: string;
}
