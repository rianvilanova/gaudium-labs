import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON payloads
  app.use(express.json());

  // API Router/Endpoints
  // Route to analyze demand details using Gemini on the server side
  app.post("/api/gemini/analisar-demanda", async (req, res) => {
    const { descricao, titulo, gerar_titulo } = req.body;

    if (!descricao) {
      res.status(400).json({ success: false, error: "A descrição é obrigatória." });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[Server Gemini] GEMINI_API_KEY não foi encontrada nas variáveis de ambiente. Usando comportamento fallback.");
      // Fallback behavior if developer hasn't configured key yet, to prevent app failures and ensure usability
      const mockTitle = (gerar_titulo || !titulo) 
        ? (descricao.slice(0, 40) + (descricao.length > 40 ? "..." : ""))
        : titulo;
      
      const lowerDesc = descricao.toLowerCase();
      let fallbackDepto = "TI";
      if (lowerDesc.includes("folha") || lowerDesc.includes("férias") || lowerDesc.includes("contratar") || lowerDesc.includes("benefício") || lowerDesc.includes("rh")) {
        fallbackDepto = "RH";
      } else if (lowerDesc.includes("campanha") || lowerDesc.includes("post") || lowerDesc.includes("designer") || lowerDesc.includes("anúncio") || lowerDesc.includes("marketing") || lowerDesc.includes("social")) {
        fallbackDepto = "Marketing";
      } else if (lowerDesc.includes("reembolso") || lowerDesc.includes("pagar") || lowerDesc.includes("financeiro") || lowerDesc.includes("faturamento") || lowerDesc.includes("contas")) {
        fallbackDepto = "Financeiro";
      }

      res.json({
        success: true,
        analise: {
          titulo: mockTitle,
          departamento_destino: fallbackDepto,
          prioridade: lowerDesc.includes("urgente") || lowerDesc.includes("erro") || lowerDesc.includes("urgência") ? "Alta" : "Média",
          sla_dias: lowerDesc.includes("urgente") ? 1 : 3,
          justificativa: "Comportamento adaptativo ativado devido à chave da API do Gemini não configurada provisoriamente. Chave ausente no painel de segredos."
        }
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let systemPrompt = `Você é um assistente de triagem inteligente e analista de processos para a "Gaudium Labs", um sistema corporativo.
Sua missão é classificar demandas para encaminhá-las ao setor correto com a prioridade e prazo (SLA) adequados.

Você deve retornar um objeto estruturado em JSON com as chaves indicadas.
Se o parâmetro gerar_titulo for true, você deve criar um título curto, sucinto, profissional e bem resumido (máximo de 8 palavras) baseado no conteúdo da descrição fornecida pelo usuário.
Se gerar_titulo for false e o usuário tiver fornecido um título em "titulo", você pode manter o título original ou fazer pequenos ajustes gramaticais/correções para torná-lo profissional.

Os departamentos válidos são estritamente: "TI", "RH", "Marketing", "Financeiro".
As prioridades válidas são estritamente: "Baixa", "Média", "Alta".
Retorne um número inteiro de quantidade de dias adequados para o SLA correspondente em sla_dias. 
Use os seguintes guias para a escolha:
- Prioridade Alta (assuntos críticos, problemas graves, erros de sistema, interrupção de trabalho, urgências financeiras imediatas): sla_dias de 1 a 2 dias.
- Prioridade Média (demandas normais, pequenos ajustes, novas campanhas, dúvidas operacionais): sla_dias de 3 a 4 dias.
- Prioridade Baixa (tarefas cotidianas não urgentes, planejamentos distantes, rotinas leves): sla_dias de 5 a 10 dias.`;

      let userMessage = `Por favor, analise a seguinte demanda:
- Descrição da Demanda: "${descricao}"
- Título informado pelo usuário (pode estar vazio): "${titulo || ""}"
- Gerar título via IA automaticamente? ${gerar_titulo ? "Sim" : "Não"}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              titulo: {
                type: Type.STRING,
                description: "Proposta de título formal e curto para a demanda. Se o usuário forneceu um e gerar_titulo for falso, use-o ou limpe-o ligeiramente. Se gerar_titulo for verdadeiro, crie um do zero condizente com a descrição.",
              },
              departamento_destino: {
                type: Type.STRING,
                description: "O setor adequado para resolver o chamado, limitado a: 'TI', 'RH', 'Marketing', 'Financeiro'. Por exemplo, problemas com sistemas/internet/computador no departamento 'TI'. Folha de pagamento, contratações ou férias no 'RH'. Campanhas ou artes no 'Marketing'. Reembolsos, notas fiscais ou faturamento no 'Financeiro'.",
              },
              prioridade: {
                type: Type.STRING,
                description: "Nível de prioridade adequado, limitado a: 'Baixa', 'Média', 'Alta'.",
              },
              sla_dias: {
                type: Type.INTEGER,
                description: "Número sugerido de dias corridos ou úteis para o prazo (SLA) a partir de hoje (por exemplo: 1, 2, 3, 5, 7, 10).",
              },
              justificativa: {
                type: Type.STRING,
                description: "Uma frase em português explicando de forma muito curta e educada o motivo de ter escolhido este departamento, prioridade e SLA correspondente.",
              },
            },
            required: ["titulo", "departamento_destino", "prioridade", "sla_dias", "justificativa"],
          },
        },
      });

      const responseText = response.text || "";
      const analise = JSON.parse(responseText.trim());

      res.json({
        success: true,
        analise
      });

    } catch (error) {
      console.error("[Server Gemini] Erro ao analisar demanda:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Proxy endpoint to handle outgoing webhooks server-side to bypass client-side CORS and sandboxing
  app.post("/api/webhook", async (req, res) => {
    const { evento, demanda } = req.body;
    const WEBHOOK_URL = "https://rianlabs.app.n8n.cloud/webhook-test/9734d683-1dc6-4641-8270-f137387ed669";
    
    try {
      console.log(`[Proxy Server] Disparando evento "${evento}" para o webhook...`);
      
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        console.warn(`[Proxy Server] Erro retornado pela n8n (${evento}): ${response.status} ${response.statusText}`);
        // Retornamos 200 de sucesso com aviso de status para evitar que o front-end mostre alertas de erro impeditivos quando o n8n está inativo
        res.json({ success: true, warning: `n8n returned status ${response.status}` });
        return;
      }

      console.log(`[Proxy Server] Evento "${evento}" enviado com sucesso.`);
      res.json({ success: true });
    } catch (error) {
      console.warn(`[Proxy Server] Conexão falhou ao disparar webhook para o evento [${evento}]:`, error);
      res.json({ success: true, warning: String(error) });
    }
  });

  // Proxy endpoint for AI creation webhook with robust local fallback fallback to cover offline n8n flows
  app.post("/api/webhook-ia", async (req, res) => {
    const { titulo, descricao } = req.body;
    const WEBHOOK_TEST_URL = "https://rianlabs.app.n8n.cloud/webhook-test/d7657715-4c14-4bf7-a4e9-52f163c2eb7c";
    const WEBHOOK_PROD_URL = "https://rianlabs.app.n8n.cloud/webhook/d7657715-4c14-4bf7-a4e9-52f163c2eb7c";
    
    let webhookSuccess = false;
    let responseData: any = null;

    // 1. Tenta o webhook-test do n8n (padrão)
    try {
      console.log(`[Proxy Server] Tentando disparar para o webhook-test da n8n...`);
      const response = await fetch(WEBHOOK_TEST_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo: titulo || "",
          descricao: descricao || ""
        }),
      });

      if (response.ok) {
        responseData = await response.json().catch(() => ({}));
        webhookSuccess = true;
        console.log(`[Proxy Server] Sucesso via webhook-test n8n.`);
      } else {
        console.warn(`[Proxy Server] webhook-test n8n retornou erro: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.warn(`[Proxy Server] Erro ao conectar no webhook-test:`, error);
    }

    // 2. Se o webhook-test falhou (ex: modo teste pausado no n8n), tenta o webhook de produção
    if (!webhookSuccess) {
      try {
        console.log(`[Proxy Server] Tentando disparar para o webhook de produção da n8n...`);
        const response = await fetch(WEBHOOK_PROD_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            titulo: titulo || "",
            descricao: descricao || ""
          }),
        });

        if (response.ok) {
          responseData = await response.json().catch(() => ({}));
          webhookSuccess = true;
          console.log(`[Proxy Server] Sucesso via webhook de produção n8n.`);
        } else {
          console.warn(`[Proxy Server] webhook de produção n8n retornou erro: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.warn(`[Proxy Server] Erro ao conectar no webhook de produção:`, error);
      }
    }

    // Se o webhook respondeu com sucesso, retorna os dados da n8n
    if (webhookSuccess && responseData && (responseData.titulo_sugerido || responseData.departamento_destino)) {
      res.json({ success: true, data: responseData });
      return;
    }

    // 3. Autocura inteligente (Self-healing fallback) com IA local ou Heurística se o n8n estiver offline/404/500
    console.log(`[Proxy Server] Iniciando inteligência de contingência local da Gaudium Labs...`);
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const systemPrompt = `Você é o assistente inteligente de triagem da Gaudium Labs.
Analise a demanda descrita e retorne um objeto JSON estrito com o seguinte esquema:
{
  "titulo_sugerido": "Título curto, profissional e objetivo da demanda baseada na descrição (máximo 8 palavras). Se o usuário informou um título, use-o ou melhore-o.",
  "departamento_destino": "Filtre obrigatoriamente um destes departamentos: 'TI', 'RH', 'Marketing', 'Financeiro'.",
  "departamento_justificativa": "Curta justificativa de por que este departamento foi selecionado.",
  "prioridade": "Obrigatoriamente um destes: 'Baixa', 'Média', 'Alta'.",
  "prioridade_justificativa": "Curta justificativa do nível de prioridade atribuído."
}`;

        const userMessage = `Descrição original: "${descricao}"\nTítulo informado pelo usuário: "${titulo || ""}"`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: userMessage,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                titulo_sugerido: { type: Type.STRING },
                departamento_destino: { type: Type.STRING },
                departamento_justificativa: { type: Type.STRING },
                prioridade: { type: Type.STRING },
                prioridade_justificativa: { type: Type.STRING }
              },
              required: ["titulo_sugerido", "departamento_destino", "departamento_justificativa", "prioridade", "prioridade_justificativa"]
            }
          }
        });

        const responseText = response.text || "";
        const parsedData = JSON.parse(responseText.trim());
        console.log(`[Proxy Server] Contingência Gemini concluída com sucesso.`);
        res.json({ success: true, data: parsedData, source: "gemini-fallback" });
        return;
      } catch (geminiError) {
        console.error(`[Proxy Server] Erro no Gemini de contingência:`, geminiError);
      }
    }

    // 4. Heurística determinística ultrassegura (última barreira de contingência preventiva)
    console.log(`[Proxy Server] Ativando heurísticas determinísticas rápidas.`);
    const lowercaseDesc = (descricao || "").toLowerCase();
    
    const titulo_sugerido = titulo ? titulo : (descricao.slice(0, 45) + (descricao.length > 45 ? "..." : ""));
    
    let departamento_destino = "TI";
    let departamento_justificativa = "A demanda cita questões técnicas de infraestrutura, software, acessos ou informática de sistemas.";
    
    if (lowercaseDesc.includes("contratar") || lowercaseDesc.includes("contratação") || lowercaseDesc.includes("benefício") || lowercaseDesc.includes("férias") || lowercaseDesc.includes("folha") || lowercaseDesc.includes("demissão") || lowercaseDesc.includes("rh") || lowercaseDesc.includes("recursos humanos")) {
      departamento_destino = "RH";
      departamento_justificativa = "O assunto está relacionado a benefícios, férias, contratação ou departamento pessoal (RH).";
    } else if (lowercaseDesc.includes("artes") || lowercaseDesc.includes("marketing") || lowercaseDesc.includes("post") || lowercaseDesc.includes("banner") || lowercaseDesc.includes("redes sociais") || lowercaseDesc.includes("campanha") || lowercaseDesc.includes("divulgar") || lowercaseDesc.includes("anúncio") || lowercaseDesc.includes("panfleto")) {
      departamento_destino = "Marketing";
      departamento_justificativa = "Refere-se ao design de artes, publicações em mídias, campanhas publicitárias ou marketing corporativo.";
    } else if (lowercaseDesc.includes("conta") || lowercaseDesc.includes("receber") || lowercaseDesc.includes("pagar") || lowercaseDesc.includes("pagamento") || lowercaseDesc.includes("financeiro") || lowercaseDesc.includes("faturamento") || lowercaseDesc.includes("reembolso") || lowercaseDesc.includes("fiscal") || lowercaseDesc.includes("nota")) {
      departamento_destino = "Financeiro";
      departamento_justificativa = "Assunto relacionado a faturamento, contas a pagar/receber, reembolsos ou movimentações financeiras.";
    }

    let prioridade = "Média";
    let prioridade_justificativa = "Fluxo operacional padrão com prioridade média atribuída automaticamente.";
    
    if (lowercaseDesc.includes("urgente") || lowercaseDesc.includes("crítico") || lowercaseDesc.includes("erro") || lowercaseDesc.includes("travado") || lowercaseDesc.includes("fora do ar") || lowercaseDesc.includes("impossibilitado") || lowercaseDesc.includes("paralisado")) {
      prioridade = "Alta";
      prioridade_justificativa = "Gravidade urgentíssima devido a termos que indicam impedimento crítico ou erros paralisantes.";
    } else if (lowercaseDesc.includes("planejamento") || lowercaseDesc.includes("futuro") || lowercaseDesc.includes("sugestão") || lowercaseDesc.includes("melhoria fluida") || lowercaseDesc.includes("baixa prioridade")) {
      prioridade = "Baixa";
      prioridade_justificativa = "Identificado com foco consultivo ou de melhoria futura sem impacto imediato.";
    }

    res.json({
      success: true,
      data: {
        titulo_sugerido,
        departamento_destino,
        departamento_justificativa,
        prioridade,
        prioridade_justificativa
      },
      source: "heuristic-fallback"
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
