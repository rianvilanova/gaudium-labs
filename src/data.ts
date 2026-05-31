import { Demanda, HistoricoDemanda, User } from "./types";
import { addDays, subHours, subMinutes } from "date-fns";

const now = new Date();

export const MOCK_USERS: User[] = [
  {
    uid: "user-colaborador-1",
    nome: "Rian Vilanova",
    email: "rian@gaudium.com",
    cargo: "Estagiário de Automação e Inovação",
    departamento: "TI",
    avatarUrl: "https://i.imgur.com/Anr80Hy.jpeg",
  },
  {
    uid: "user-gestor-1",
    nome: "Dalton Malucelli",
    email: "dalton@gaudium.com",
    cargo: "Gestor de TI",
    departamento: "TI",
  },
  {
    uid: "user-colaborador-2",
    nome: "Maria Clara",
    email: "mariaclara@gaudium.com",
    cargo: "Recrutadora",
    departamento: "RH",
  },
  {
    uid: "user-gestor-2",
    nome: "Marcos Dias",
    email: "marcos@gaudium.com",
    cargo: "Gestor de RH",
    departamento: "RH",
  },
  {
    uid: "user-colaborador-3",
    nome: "Amanda Rocha",
    email: "amanda@gaudium.com",
    cargo: "Analista de Marketing",
    departamento: "Marketing",
  },
  {
    uid: "user-gestor-3",
    nome: "Bruno Muniz",
    email: "bruno@gaudium.com",
    cargo: "Diretor",
    departamento: "Marketing",
  },
  {
    uid: "user-colaborador-4",
    nome: "Camila Souza",
    email: "camila@gaudium.com",
    cargo: "Analista Financeiro",
    departamento: "Financeiro",
  },
  {
    uid: "user-gestor-4",
    nome: "Diego Mendes",
    email: "diego@gaudium.com",
    cargo: "Gestor Financeiro",
    departamento: "Financeiro",
  },
];

// Let Rian be in UI or TI? The prompt says "departamento (enum: 'TI', 'RH', 'Marketing', 'Financeiro')."
MOCK_USERS[0].departamento = "TI";

export const MOCK_DEMANDAS: Demanda[] = [
  {
    id: "demanda-1",
    titulo: "Configurar acessos para 5 novos estagiários",
    descricao: "Necessitamos que sejam criadas as contas no Google Workspace, permissões de repositório no GitHub (time frontend e backend) e licenças do Jira para 5 novos estagiários do programa de jovens talentos. Planilha com nomes e e-mails em anexo.",
    criado_em: subHours(now, 48).toISOString(),
    criado_por: "user-colaborador-2", // Maria Clara (RH)
    departamento_destino: "TI",
    prioridade: "Alta",
    status: "Em Andamento",
    responsaveis_ids: ["user-gestor-1"], // Dalton
    prazo_sla: addDays(now, 1).toISOString()
  },
  {
    id: "demanda-2",
    titulo: "Reembolso das notas fiscais - Evento Recrutamento SP",
    descricao: "Solicito o faturamento e reembolso de R$ 4.500,00 referente aos voos, estadia e alimentação do evento de captação que a equipe de RH participou na semana passada. Notas fiscais devidamente anexadas na pasta compartilhada.",
    criado_em: subHours(now, 26).toISOString(),
    criado_por: "user-gestor-2", // Marcos (RH)
    departamento_destino: "Financeiro",
    prioridade: "Média",
    status: "Pendente",
    responsaveis_ids: [],
    prazo_sla: addDays(now, 4).toISOString()
  },
  {
    id: "demanda-3",
    titulo: "Aprovação e pagamento de renovação: Adobe Creative Cloud",
    descricao: "Necessito que aprovem o aditamento de contrato anual e realizem o pagamento para a renovação das licenças de todo o time de design e videomakers da nossa equipe de marketing.",
    criado_em: subHours(now, 72).toISOString(),
    criado_por: "user-colaborador-3", // Amanda (Marketing)
    departamento_destino: "Financeiro",
    prioridade: "Alta",
    status: "Em Andamento",
    responsaveis_ids: ["user-gestor-4"], // Diego (Financeiro)
    prazo_sla: addDays(now, 1).toISOString()
  },
  {
    id: "demanda-4",
    titulo: "Extração de dados para auditoria (Q2 2026)",
    descricao: "A Ernst & Young solicitou a extração dos logs transacionais e de pagamentos do nosso banco de dados referentes aos clientes premium do segundo trimestre de 2026. A extração deve ser mascarada perante a LGPD.",
    criado_em: subHours(now, 14).toISOString(),
    criado_por: "user-gestor-4", // Diego (Financeiro)
    departamento_destino: "TI",
    prioridade: "Baixa",
    status: "Pendente",
    responsaveis_ids: [],
    prazo_sla: addDays(now, 7).toISOString()
  },
  {
    id: "demanda-5",
    titulo: "Elaborar novo material visual institucional de Onboarding",
    descricao: "O processo atual está sendo feito com PDFs muito antigos. Gostaríamos que o time de marketing gerasse um deck no Figma e cartões impressos de boas-vindas com o novo branding da empresa (Gaudium) para darmos aos novos admitidos.",
    criado_em: subHours(now, 120).toISOString(),
    criado_por: "user-gestor-2", // Marcos (RH)
    departamento_destino: "Marketing",
    prioridade: "Média",
    status: "Concluído",
    responsaveis_ids: ["user-colaborador-3", "user-gestor-3"],
    prazo_sla: subHours(now, 5).toISOString()
  },
  {
    id: "demanda-6",
    titulo: "Abertura de vaga: Engenheiro DevOps / SRE Sênior",
    descricao: "Precisamos iniciar o processo seletivo (elaboração do job description e publicação na Gupy/LinkedIn) para preencher essa vaga. Justificativa: a nossa infraestrutura cresceu 3 vezes no último ano e precisamos de mão de obra sênior focada na nuvem.",
    criado_em: subHours(now, 5).toISOString(),
    criado_por: "user-gestor-1", // Dalton (TI)
    departamento_destino: "RH",
    prioridade: "Alta",
    status: "Pendente",
    responsaveis_ids: [],
    prazo_sla: addDays(now, 3).toISOString()
  },
  {
    id: "demanda-7",
    titulo: "Instabilidades com a rede Wi-Fi corporativa no 3º Andar",
    descricao: "Desde segunda-feira à tarde, os colaboradores do time Financeiro estão reclamando de quedas bruscas de internet na sala principal ao realizar chamadas de vídeo.",
    criado_em: subHours(now, 2).toISOString(),
    criado_por: "user-colaborador-4", // Camila (Financeiro)
    departamento_destino: "TI",
    prioridade: "Alta",
    status: "Pendente",
    responsaveis_ids: [],
    prazo_sla: addDays(now, 1).toISOString()
  },
  {
    id: "demanda-8",
    titulo: "Comunicado Interno: Atualização do Plano de Saúde Bradesco",
    descricao: "Os valores e condições do plano mudarão na próxima virada de mês. Precisamos enviar um comunicado oficial para toda a base de colaboradores (Slack e E-mail Institucional). Anexei o rascunho dos novos termos.",
    criado_em: subHours(now, 50).toISOString(),
    criado_por: "user-gestor-2", // Marcos (RH)
    departamento_destino: "Marketing",
    prioridade: "Média",
    status: "Em Andamento",
    responsaveis_ids: ["user-colaborador-3"], // Amanda (Marketing)
    prazo_sla: addDays(now, 2).toISOString()
  }
];

export const MOCK_HISTORICO: HistoricoDemanda[] = [
  {
    id: "hist-1",
    demanda_id: "demanda-1",
    descricao_acao: "Demanda criada por Maria Clara.",
    alterado_em: subHours(now, 48).toISOString(),
    alterado_por: "user-colaborador-2"
  },
  {
    id: "hist-2",
    demanda_id: "demanda-1",
    descricao_acao: "A demanda foi atribuída para Dalton Malucelli.",
    alterado_em: subHours(now, 40).toISOString(),
    alterado_por: "user-gestor-1"
  },
  {
    id: "hist-3",
    demanda_id: "demanda-1",
    descricao_acao: "Status alterado para 'Em Andamento' por Dalton Malucelli.",
    alterado_em: subHours(now, 39).toISOString(),
    alterado_por: "user-gestor-1"
  },
  {
    id: "hist-4",
    demanda_id: "demanda-3",
    descricao_acao: "Demanda criada por Amanda Rocha.",
    alterado_em: subHours(now, 72).toISOString(),
    alterado_por: "user-colaborador-3"
  },
  {
    id: "hist-5",
    demanda_id: "demanda-3",
    descricao_acao: "A demanda foi atribuída para Diego Mendes.",
    alterado_em: subHours(now, 60).toISOString(),
    alterado_por: "user-gestor-4"
  },
  {
    id: "hist-6",
    demanda_id: "demanda-3",
    descricao_acao: "Status alterado para 'Em Andamento'. Processo de pagamento em aprovação na mesa da diretoria.",
    alterado_em: subHours(now, 58).toISOString(),
    alterado_por: "user-gestor-4"
  },
  {
    id: "hist-7",
    demanda_id: "demanda-5",
    descricao_acao: "Demanda criada por Marcos Dias.",
    alterado_em: subHours(now, 120).toISOString(),
    alterado_por: "user-gestor-2"
  },
  {
    id: "hist-8",
    demanda_id: "demanda-5",
    descricao_acao: "Status alterado para 'Concluído'. Material entregue e aprovado pelo RH.",
    alterado_em: subHours(now, 5).toISOString(),
    alterado_por: "user-gestor-3"
  }
];
