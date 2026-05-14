import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/app/components/locale-switcher";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { listProjectKeywords, listProjectSubreddits } from "@/db/queries/settings";
import { listProjectXKeywords } from "@/db/queries/x";
import { listActiveExtensionTokens } from "@/db/queries/extension-tokens";
import type { ExtensionTokenDTO, KeywordDTO, XKeywordDTO } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";
import { getCurrentAiReplyUsage, getCurrentBillingPlan } from "@/modules/billing/current";
import {
  beginBillingCheckoutFromForm,
  openBillingPortalFromForm,
} from "@/modules/billing/actions";
import { resolveCurrentProject } from "@/modules/projects/current";
import {
  updateProjectFromForm,
  addKeywordFromForm,
  addCompetitorFromForm,
  updateKeywordFromForm,
  removeKeywordFromForm,
  toggleKeywordFromForm,
  addXKeywordFromForm,
  updateXKeywordFromForm,
  toggleXKeywordFromForm,
  removeXKeywordFromForm,
} from "@/modules/projects/settings-actions";
import { PromptsTab } from "./prompts-tab";
import { deleteProjectFromForm } from "@/modules/projects/delete-actions";
import {
  generateConnectTokenFromForm,
  revokeExtensionTokenFromForm,
} from "@/modules/outbound/extension-token-actions";
import { ExtensionConnectTokenNotice } from "./extension-connect-token-notice";

export const metadata: Metadata = {
  title: "Settings",
};

type LocaleCode = "en" | "es" | "pt";

type SettingsCopy = {
  pageTitle: string;
  pageSummary: (args: {
    keywords: number;
    competitors: number;
    communities: number;
    xRules: number;
    xEnabled: boolean;
  }) => string;
  tabsAriaLabel: string;
  tabs: Record<SettingsTab, string>;
  general: {
    title: string;
    description: string;
    projectName: string;
    website: string;
    websitePlaceholder: string;
    region: string;
    regionPlaceholder: string;
    companyInfo: string;
    companyInfoPlaceholder: string;
    appLanguage: string;
    save: string;
  };
  competitors: {
    title: string;
    description: string;
    activeBadge: (count: number) => string;
    empty: string;
    termPlaceholder: string;
    websitePlaceholder: string;
    add: string;
    note: string;
  };
  keywords: {
    title: string;
    description: string;
    activeBadge: (count: number) => string;
    suggestedByAi: string;
    custom: string;
    addPlaceholder: string;
    add: string;
    xTitle: string;
    xDescription: string;
    xEmpty: string;
    xPlaceholder: string;
    xLockedDescription: string;
    xUpgrade: string;
  };
  notifications: {
    title: string;
    description: string;
    email: string;
    emailDescription: string;
    mentionFetching: string;
    keywordOpportunities: string;
    searchWindow: (window: string) => string;
    everyHours: (hours: number) => string;
  };
  billing: {
    title: string;
    description: string;
    plan: string;
    aiReplies: string;
    redditKeywords: string;
    xKeywords: string;
    competitors: string;
    ghostwriterThreads: string;
    teamMembers: string;
    redditAccounts: string;
    note: string;
    switchToStartup: string;
    upgradeToGrowth: string;
    upgradeToProfessional: string;
    currentPlan: (label: string) => string;
    manage: string;
  };
  dangerZone: {
    title: string;
    description: string;
    confirm: (projectName: string) => string;
    delete: string;
  };
  keywordGroup: {
    empty: (title: string) => string;
  };
  keywordRow: {
    typeAi: string;
    typeComp: string;
    typeCustom: string;
    pause: string;
    enable: string;
    save: string;
    remove: string;
  };
  xKeywordRow: {
    pause: string;
    enable: string;
    save: string;
    remove: string;
    rule: string;
  };
  xGuide: {
    title: string;
    combine: string;
    operators: Array<{ op: string; desc: string }>;
  };
  extension: {
    title: string;
    description: string;
    generate: string;
    sessionsTitle: string;
    sessionsDescription: string;
    activeBadge: (count: number) => string;
    empty: string;
    connected: (when: string) => string;
    lastUsed: (when: string) => string;
    defaultLabel: string;
    revoke: string;
  };
  relativeDate: {
    minutesAgo: (mins: number) => string;
    hoursAgo: (hours: number) => string;
    daysAgo: (days: number) => string;
  };
  unlimited: string;
};

const SETTINGS_COPY: Record<LocaleCode, SettingsCopy> = {
  en: {
    pageTitle: "Settings",
    pageSummary: ({ keywords, competitors, communities, xRules, xEnabled }) =>
      `${keywords} active keywords · ${competitors} competitors · ${communities} communities monitored${xEnabled ? ` · ${xRules} X rules` : ""}`,
    tabsAriaLabel: "Settings sections",
    tabs: {
      general: "General",
      competitors: "Competitors",
      keywords: "Keywords",
      prompts: "Prompts",
      notifications: "Notifications",
      billing: "Billing",
      extension: "Extension",
    },
    general: {
      title: "General",
      description: "Project identity and company context used across classification, mentions and reply generation.",
      projectName: "Project name",
      website: "Website",
      websitePlaceholder: "https://yoursite.com",
      region: "Region",
      regionPlaceholder: "US, LATAM, Global",
      companyInfo: "Company info",
      companyInfoPlaceholder: "What you sell, who it is for, positioning, ICP, use cases and proof points.",
      appLanguage: "App language",
      save: "Save general settings",
    },
    competitors: {
      title: "Competitors",
      description: "Competitor names are tracked as competitor keywords for mentions, comparisons and battlecards.",
      activeBadge: (count) => `${count} active`,
      empty: "No competitors yet. Add one below.",
      termPlaceholder: "Competitor name",
      websitePlaceholder: "Website (coming next)",
      add: "Add",
      note: "Competitor websites are not persisted yet because the current data model stores competitors as keyword records.",
    },
    keywords: {
      title: "Keywords",
      description: "Terms used to discover opportunities across Reddit API and Google search.",
      activeBadge: (count) => `${count} active`,
      suggestedByAi: "Suggested by AI",
      custom: "Custom",
      addPlaceholder: "Add keyword",
      add: "Add",
      xTitle: "X Keywords",
      xDescription: "Filtered stream rules for X (Twitter). Use X query syntax: exact phrases, OR groups, lang:, min_faves: and similar operators.",
      xEmpty: "No X queries yet. Add your first filtered stream rule below.",
      xPlaceholder: 'Example: (crm OR "project management") lang:en -is:retweet',
      xLockedDescription: "Upgrade to Growth to monitor X (Twitter) for buyer-intent posts and mentions.",
      xUpgrade: "Upgrade →",
    },
    notifications: {
      title: "Notifications",
      description: "Get notified when new leads, Google mentions, or Reddit mentions are found for this project.",
      email: "Email",
      emailDescription: "Email notifications are sent automatically to your account email when new leads, Google results, or mentions are found.",
      mentionFetching: "Mention fetching",
      keywordOpportunities: "Keyword opportunities",
      searchWindow: (window) => `Search window: ${window}`,
      everyHours: (hours) => `Every ${hours}h`,
    },
    billing: {
      title: "Billing",
      description: "Current plan limits, upgrades and subscription management.",
      plan: "Plan",
      aiReplies: "AI replies",
      redditKeywords: "Reddit keywords",
      xKeywords: "X keywords",
      competitors: "Competitors",
      ghostwriterThreads: "Ghostwriter threads",
      teamMembers: "Team members",
      redditAccounts: "Reddit accounts",
      note: "Upgrades now redirect to a Lemon Squeezy hosted checkout. Existing customers can manage renewals, payment methods and cancellations in the customer portal.",
      switchToStartup: "Switch to Startup",
      upgradeToGrowth: "Upgrade to Growth",
      upgradeToProfessional: "Upgrade to Professional",
      currentPlan: (label) => `${label} current`,
      manage: "Manage billing",
    },
    dangerZone: {
      title: "Danger zone",
      description: "Delete this project and all its keywords, leads, replies, suggestions and scraping history.",
      confirm: (projectName) => `Type DELETE to confirm deletion of ${projectName}.`,
      delete: "Delete project",
    },
    keywordGroup: {
      empty: (title) => `No ${title.toLowerCase()} keywords yet.`,
    },
    keywordRow: {
      typeAi: "AI",
      typeComp: "Comp",
      typeCustom: "Custom",
      pause: "Pause",
      enable: "Enable",
      save: "Save",
      remove: "Remove",
    },
    xKeywordRow: {
      pause: "Pause",
      enable: "Enable",
      save: "Save",
      remove: "Remove",
      rule: "Rule",
    },
    xGuide: {
      title: "Query syntax reference",
      combine: "Combine operators in one query:",
      operators: [
        { op: "-is:retweet", desc: "Exclude retweets (almost always needed)" },
        { op: "lang:en", desc: "Only English tweets" },
        { op: "(termA OR termB)", desc: "Match either term" },
        { op: '"exact phrase"', desc: "Exact phrase match" },
        { op: "-is:reply", desc: "Exclude replies to others" },
        { op: "has:links", desc: "Only tweets with links" },
        { op: "is:verified", desc: "Only verified accounts" },
        { op: "min_faves:10", desc: "Minimum like count" },
        { op: "from:username", desc: "Only from a specific account" },
      ],
    },
    extension: {
      title: "Chrome Extension",
      description: "Generate a one-time connect token to pair your browser extension with this project. The token expires in 15 minutes and can only be used once.",
      generate: "Generate connect token",
      sessionsTitle: "Active extension sessions",
      sessionsDescription: "Devices currently connected to this project via the Chrome Extension.",
      activeBadge: (count) => `${count} active`,
      empty: "No active sessions. Generate a connect token and use it in the extension to pair a device.",
      connected: (when) => `Connected ${when}`,
      lastUsed: (when) => `Last used ${when}`,
      defaultLabel: "Extension",
      revoke: "Revoke",
    },
    relativeDate: {
      minutesAgo: (mins) => `${mins}m ago`,
      hoursAgo: (hours) => `${hours}h ago`,
      daysAgo: (days) => `${days}d ago`,
    },
    unlimited: "Unlimited",
  },
  es: {
    pageTitle: "Configuración",
    pageSummary: ({ keywords, competitors, communities, xRules, xEnabled }) =>
      `${keywords} keywords activas · ${competitors} competidores · ${communities} comunidades monitoreadas${xEnabled ? ` · ${xRules} reglas de X` : ""}`,
    tabsAriaLabel: "Secciones de configuración",
    tabs: {
      general: "General",
      competitors: "Competidores",
      keywords: "Keywords",
      prompts: "Prompts",
      notifications: "Notificaciones",
      billing: "Billing",
      extension: "Extensión",
    },
    general: {
      title: "General",
      description: "Identidad del proyecto y contexto de la empresa usados en clasificación, menciones y generación de respuestas.",
      projectName: "Nombre del proyecto",
      website: "Sitio web",
      websitePlaceholder: "https://tusitio.com",
      region: "Región",
      regionPlaceholder: "US, LATAM, Global",
      companyInfo: "Información de la empresa",
      companyInfoPlaceholder: "Qué vendés, para quién, posicionamiento, ICP, casos de uso y pruebas.",
      appLanguage: "Idioma de la app",
      save: "Guardar configuración general",
    },
    competitors: {
      title: "Competidores",
      description: "Los nombres de competidores se guardan como keywords de competidor para menciones, comparaciones y battlecards.",
      activeBadge: (count) => `${count} activos`,
      empty: "Todavía no hay competidores. Agregá uno abajo.",
      termPlaceholder: "Nombre del competidor",
      websitePlaceholder: "Sitio web (próximamente)",
      add: "Agregar",
      note: "Los sitios web de competidores todavía no se guardan porque el modelo actual los almacena como registros de keywords.",
    },
    keywords: {
      title: "Keywords",
      description: "Términos usados para descubrir oportunidades en Reddit API y búsqueda de Google.",
      activeBadge: (count) => `${count} activas`,
      suggestedByAi: "Sugeridas por IA",
      custom: "Personalizadas",
      addPlaceholder: "Agregar keyword",
      add: "Agregar",
      xTitle: "Keywords de X",
      xDescription: "Reglas de stream filtrado para X (Twitter). Usá sintaxis de consulta de X: frases exactas, grupos OR, lang:, min_faves: y operadores similares.",
      xEmpty: "Todavía no hay consultas de X. Agregá abajo tu primera regla del stream filtrado.",
      xPlaceholder: 'Ejemplo: (crm OR "project management") lang:en -is:retweet',
      xLockedDescription: "Pasate a Growth para monitorear X (Twitter) en busca de posts y menciones con intención de compra.",
      xUpgrade: "Mejorar →",
    },
    notifications: {
      title: "Notificaciones",
      description: "Recibí alertas cuando se encuentren nuevos leads, menciones en Google o menciones en Reddit para este proyecto.",
      email: "Email",
      emailDescription: "Las notificaciones por email se envían automáticamente a tu cuenta cuando aparecen nuevos leads, resultados de Google o menciones.",
      mentionFetching: "Extracción de menciones",
      keywordOpportunities: "Oportunidades por keywords",
      searchWindow: (window) => `Ventana de búsqueda: ${window}`,
      everyHours: (hours) => `Cada ${hours}h`,
    },
    billing: {
      title: "Billing",
      description: "Límites del plan actual, upgrades y gestión de suscripción.",
      plan: "Plan",
      aiReplies: "Respuestas IA",
      redditKeywords: "Keywords de Reddit",
      xKeywords: "Keywords de X",
      competitors: "Competidores",
      ghostwriterThreads: "Threads de Ghostwriter",
      teamMembers: "Miembros del equipo",
      redditAccounts: "Cuentas de Reddit",
      note: "Los upgrades ahora redirigen a un checkout alojado en Lemon Squeezy. Los clientes existentes pueden gestionar renovaciones, medios de pago y cancelaciones desde el portal del cliente.",
      switchToStartup: "Cambiar a Startup",
      upgradeToGrowth: "Mejorar a Growth",
      upgradeToProfessional: "Mejorar a Professional",
      currentPlan: (label) => `${label} actual`,
      manage: "Gestionar billing",
    },
    dangerZone: {
      title: "Zona de peligro",
      description: "Eliminá este proyecto y todas sus keywords, leads, respuestas, sugerencias e historial de scraping.",
      confirm: (projectName) => `Escribí DELETE para confirmar la eliminación de ${projectName}.`,
      delete: "Eliminar proyecto",
    },
    keywordGroup: {
      empty: (title) => `Todavía no hay keywords en ${title.toLowerCase()}.`,
    },
    keywordRow: {
      typeAi: "IA",
      typeComp: "Comp",
      typeCustom: "Manual",
      pause: "Pausar",
      enable: "Activar",
      save: "Guardar",
      remove: "Eliminar",
    },
    xKeywordRow: {
      pause: "Pausar",
      enable: "Activar",
      save: "Guardar",
      remove: "Eliminar",
      rule: "Regla",
    },
    xGuide: {
      title: "Referencia de sintaxis",
      combine: "Combiná operadores en una consulta:",
      operators: [
        { op: "-is:retweet", desc: "Excluir retweets (casi siempre necesario)" },
        { op: "lang:en", desc: "Solo tweets en inglés" },
        { op: "(termA OR termB)", desc: "Coincide con cualquiera de los términos" },
        { op: '"exact phrase"', desc: "Coincidencia exacta de frase" },
        { op: "-is:reply", desc: "Excluir respuestas a otros" },
        { op: "has:links", desc: "Solo tweets con enlaces" },
        { op: "is:verified", desc: "Solo cuentas verificadas" },
        { op: "min_faves:10", desc: "Cantidad mínima de likes" },
        { op: "from:username", desc: "Solo de una cuenta específica" },
      ],
    },
    extension: {
      title: "Extensión de Chrome",
      description: "Generá un token de conexión de un solo uso para vincular la extensión del navegador con este proyecto. El token expira en 15 minutos y solo puede usarse una vez.",
      generate: "Generar token de conexión",
      sessionsTitle: "Sesiones activas de la extensión",
      sessionsDescription: "Dispositivos conectados actualmente a este proyecto mediante la extensión de Chrome.",
      activeBadge: (count) => `${count} activas`,
      empty: "No hay sesiones activas. Generá un token de conexión y usalo en la extensión para vincular un dispositivo.",
      connected: (when) => `Conectado ${when}`,
      lastUsed: (when) => `Último uso ${when}`,
      defaultLabel: "Extensión",
      revoke: "Revocar",
    },
    relativeDate: {
      minutesAgo: (mins) => `hace ${mins}m`,
      hoursAgo: (hours) => `hace ${hours}h`,
      daysAgo: (days) => `hace ${days}d`,
    },
    unlimited: "Ilimitado",
  },
  pt: {
    pageTitle: "Configurações",
    pageSummary: ({ keywords, competitors, communities, xRules, xEnabled }) =>
      `${keywords} palavras-chave ativas · ${competitors} concorrentes · ${communities} comunidades monitoradas${xEnabled ? ` · ${xRules} regras de X` : ""}`,
    tabsAriaLabel: "Seções de configurações",
    tabs: {
      general: "Geral",
      competitors: "Concorrentes",
      keywords: "Palavras-chave",
      prompts: "Prompts",
      notifications: "Notificações",
      billing: "Cobrança",
      extension: "Extensão",
    },
    general: {
      title: "Geral",
      description: "Identidade do projeto e contexto da empresa usados em classificação, menções e geração de respostas.",
      projectName: "Nome do projeto",
      website: "Site",
      websitePlaceholder: "https://seusite.com",
      region: "Região",
      regionPlaceholder: "US, LATAM, Global",
      companyInfo: "Informações da empresa",
      companyInfoPlaceholder: "O que você vende, para quem, posicionamento, ICP, casos de uso e provas.",
      appLanguage: "Idioma do app",
      save: "Salvar configurações gerais",
    },
    competitors: {
      title: "Concorrentes",
      description: "Os nomes dos concorrentes são acompanhados como palavras-chave de concorrente para menções, comparações e battlecards.",
      activeBadge: (count) => `${count} ativos`,
      empty: "Ainda não há concorrentes. Adicione um abaixo.",
      termPlaceholder: "Nome do concorrente",
      websitePlaceholder: "Site (em breve)",
      add: "Adicionar",
      note: "Os sites dos concorrentes ainda não são persistidos porque o modelo atual os armazena como registros de palavras-chave.",
    },
    keywords: {
      title: "Palavras-chave",
      description: "Termos usados para descobrir oportunidades na API do Reddit e na busca do Google.",
      activeBadge: (count) => `${count} ativas`,
      suggestedByAi: "Sugeridas por IA",
      custom: "Personalizadas",
      addPlaceholder: "Adicionar palavra-chave",
      add: "Adicionar",
      xTitle: "Palavras-chave de X",
      xDescription: "Regras de stream filtrado para X (Twitter). Use a sintaxe de consulta do X: frases exatas, grupos OR, lang:, min_faves: e operadores semelhantes.",
      xEmpty: "Ainda não há consultas de X. Adicione abaixo sua primeira regra do stream filtrado.",
      xPlaceholder: 'Exemplo: (crm OR "project management") lang:en -is:retweet',
      xLockedDescription: "Faça upgrade para Growth para monitorar o X (Twitter) em busca de posts e menções com intenção de compra.",
      xUpgrade: "Fazer upgrade →",
    },
    notifications: {
      title: "Notificações",
      description: "Receba alertas quando novos leads, menções no Google ou menções no Reddit forem encontrados para este projeto.",
      email: "E-mail",
      emailDescription: "As notificações por e-mail são enviadas automaticamente para sua conta quando novos leads, resultados do Google ou menções são encontrados.",
      mentionFetching: "Coleta de menções",
      keywordOpportunities: "Oportunidades por palavras-chave",
      searchWindow: (window) => `Janela de busca: ${window}`,
      everyHours: (hours) => `A cada ${hours}h`,
    },
    billing: {
      title: "Cobrança",
      description: "Limites do plano atual, upgrades e gerenciamento de assinatura.",
      plan: "Plano",
      aiReplies: "Respostas IA",
      redditKeywords: "Palavras-chave do Reddit",
      xKeywords: "Palavras-chave de X",
      competitors: "Concorrentes",
      ghostwriterThreads: "Threads do Ghostwriter",
      teamMembers: "Membros da equipe",
      redditAccounts: "Contas do Reddit",
      note: "Os upgrades agora redirecionam para um checkout hospedado no Lemon Squeezy. Clientes existentes podem gerenciar renovações, formas de pagamento e cancelamentos no portal do cliente.",
      switchToStartup: "Mudar para Startup",
      upgradeToGrowth: "Fazer upgrade para Growth",
      upgradeToProfessional: "Fazer upgrade para Professional",
      currentPlan: (label) => `${label} atual`,
      manage: "Gerenciar cobrança",
    },
    dangerZone: {
      title: "Zona de perigo",
      description: "Exclua este projeto e todas as suas palavras-chave, leads, respostas, sugestões e histórico de scraping.",
      confirm: (projectName) => `Digite DELETE para confirmar a exclusão de ${projectName}.`,
      delete: "Excluir projeto",
    },
    keywordGroup: {
      empty: (title) => `Ainda não há palavras-chave em ${title.toLowerCase()}.`,
    },
    keywordRow: {
      typeAi: "IA",
      typeComp: "Comp",
      typeCustom: "Manual",
      pause: "Pausar",
      enable: "Ativar",
      save: "Salvar",
      remove: "Remover",
    },
    xKeywordRow: {
      pause: "Pausar",
      enable: "Ativar",
      save: "Salvar",
      remove: "Remover",
      rule: "Regra",
    },
    xGuide: {
      title: "Referência de sintaxe",
      combine: "Combine operadores em uma consulta:",
      operators: [
        { op: "-is:retweet", desc: "Excluir retweets (quase sempre necessário)" },
        { op: "lang:en", desc: "Somente tweets em inglês" },
        { op: "(termA OR termB)", desc: "Corresponde a qualquer termo" },
        { op: '"exact phrase"', desc: "Correspondência exata de frase" },
        { op: "-is:reply", desc: "Excluir respostas a outras pessoas" },
        { op: "has:links", desc: "Somente tweets com links" },
        { op: "is:verified", desc: "Somente contas verificadas" },
        { op: "min_faves:10", desc: "Quantidade mínima de curtidas" },
        { op: "from:username", desc: "Somente de uma conta específica" },
      ],
    },
    extension: {
      title: "Extensão do Chrome",
      description: "Gere um token de conexão de uso único para vincular a extensão do navegador a este projeto. O token expira em 15 minutos e só pode ser usado uma vez.",
      generate: "Gerar token de conexão",
      sessionsTitle: "Sessões ativas da extensão",
      sessionsDescription: "Dispositivos atualmente conectados a este projeto pela extensão do Chrome.",
      activeBadge: (count) => `${count} ativas`,
      empty: "Não há sessões ativas. Gere um token de conexão e use-o na extensão para vincular um dispositivo.",
      connected: (when) => `Conectado ${when}`,
      lastUsed: (when) => `Último uso ${when}`,
      defaultLabel: "Extensão",
      revoke: "Revogar",
    },
    relativeDate: {
      minutesAgo: (mins) => `há ${mins}m`,
      hoursAgo: (hours) => `há ${hours}h`,
      daysAgo: (days) => `há ${days}d`,
    },
    unlimited: "Ilimitado",
  },
};

type SettingsPageProps = {
  searchParams?: Promise<{ projectId?: string; tab?: string }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const user = await requireUser("/settings");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/bootstrap");

  const { currentProject } = projectState;


  const selectedTab = parseSettingsTab(params?.tab);

  const [currentLocale, t, keywords, subreddits, xKeywords, billingPlan, aiReplyUsage, extensionTokens] = await Promise.all([
    getLocale(),
    getTranslations("settings"),
    listProjectKeywords(currentProject.id),
    listProjectSubreddits(currentProject.id),
    listProjectXKeywords(currentProject.id),
    getCurrentBillingPlan(),
    getCurrentAiReplyUsage(),
    selectedTab === "extension" ? listActiveExtensionTokens(user.id, currentProject.id) : Promise.resolve([]),
  ]);
  const competitorKeywords = keywords.filter((k) => k.type === "competitor");
  const redditKeywords = keywords.filter((k) => k.type !== "competitor");
  const activeKeywords = redditKeywords.filter((k) => k.is_active);
  const activeSubreddits = subreddits.filter((s) => s.is_active);
  const activeCompetitors = competitorKeywords.filter((k) => k.is_active);
  const activeXKeywords = xKeywords.filter((k) => k.is_active);
  const localeCode: LocaleCode = currentLocale.startsWith("es") ? "es" : currentLocale.startsWith("pt") ? "pt" : "en";
  const copy = SETTINGS_COPY[localeCode];

  return (
    <DashboardShell
      user={user}
      currentProject={currentProject}

    >
      <div className="app-page" style={{ minHeight: "100vh" }}>
        <header className="page-header">
          <div>
            <p className="page-kicker">{t("kicker")}</p>
            <h1 className="page-title">{currentProject.name}</h1>
            <p className="page-copy">
              {copy.pageSummary({
                keywords: activeKeywords.length,
                competitors: activeCompetitors.length,
                communities: activeSubreddits.length,
                xRules: activeXKeywords.length,
                xEnabled: billingPlan.xEnabled,
              })}
            </p>
          </div>
        </header>

        <main
          style={{
            maxWidth: 1040,
            margin: "0 auto",
            padding: "0 20px 60px",
          }}
        >
          <SettingsTabs projectId={currentProject.id} selectedTab={selectedTab} copy={copy} />

          {selectedTab === "general" && (
            <SettingsSection
              title={copy.general.title}
              description={copy.general.description}
            >
              <div style={{ display: "grid", gap: 18 }}>
                <form action={updateProjectFromForm}>
                  <input type="hidden" name="projectId" value={currentProject.id} />
                  <div style={{ display: "grid", gap: 14 }}>
                    <FieldRow label={copy.general.projectName}>
                      <input className="settings-input" name="name" defaultValue={currentProject.name} required />
                    </FieldRow>
                    <FieldRow label={copy.general.website}>
                      <input className="settings-input" name="websiteUrl" defaultValue={currentProject.website_url ?? ""} placeholder={copy.general.websitePlaceholder} type="url" />
                    </FieldRow>
                    <FieldRow label={copy.general.region}>
                      <input className="settings-input" name="region" defaultValue={currentProject.region ?? ""} placeholder={copy.general.regionPlaceholder} />
                    </FieldRow>
                    <FieldRow label={copy.general.companyInfo} vertical>
                      <textarea className="settings-input" name="valueProposition" defaultValue={currentProject.value_proposition ?? ""} placeholder={copy.general.companyInfoPlaceholder} rows={5} style={{ resize: "vertical" }} />
                    </FieldRow>
                    <FieldRow label={copy.general.appLanguage}>
                      <LocaleSwitcher currentLocale={currentLocale} />
                    </FieldRow>
                    <FormFooter label={copy.general.save} />
                  </div>
                </form>

                <DangerZone projectId={currentProject.id} projectName={currentProject.name} copy={copy} />
              </div>
            </SettingsSection>
          )}

          {selectedTab === "competitors" && (
            <SettingsSection
              title={copy.competitors.title}
              description={copy.competitors.description}
              badge={copy.competitors.activeBadge(activeCompetitors.length)}
            >
              <div style={{ display: "grid", gap: 10 }}>
                {competitorKeywords.length === 0 ? (
                  <EmptyHint>{copy.competitors.empty}</EmptyHint>
                ) : (
                  competitorKeywords.map((keyword) => (
                    <KeywordRow key={keyword.id} keyword={keyword} projectId={currentProject.id} editable copy={copy} />
                  ))
                )}
              </div>
              <form action={addCompetitorFromForm} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginTop: 14 }}>
                <input type="hidden" name="projectId" value={currentProject.id} />
                <input className="settings-input" name="term" placeholder={copy.competitors.termPlaceholder} required />
                <input className="settings-input" name="website" placeholder={copy.competitors.websitePlaceholder} disabled />
                <button type="submit" className="settings-btn-primary">{copy.competitors.add}</button>
              </form>
              <p className="section-copy" style={{ marginTop: 10 }}>
                {copy.competitors.note}
              </p>
            </SettingsSection>
          )}

          {selectedTab === "keywords" && (
            <div style={{ display: "grid", gap: 16 }}>
              <SettingsSection
                title={copy.keywords.title}
                description={copy.keywords.description}
                badge={copy.keywords.activeBadge(activeKeywords.length)}
              >
                <KeywordGroup title={copy.keywords.suggestedByAi} keywords={redditKeywords.filter((k) => k.type === "ai_suggested")} projectId={currentProject.id} copy={copy} />
                <KeywordGroup title={copy.keywords.custom} keywords={redditKeywords.filter((k) => k.type === "custom" || k.type === "searchbox")} projectId={currentProject.id} editable copy={copy} />

                <div style={{ display: "grid", gap: 8, marginTop: 16, borderTop: "1px solid #EDEFF1", paddingTop: 14 }}>
                  <form action={addKeywordFromForm} style={{ display: "flex", gap: 8 }}>
                    <input type="hidden" name="projectId" value={currentProject.id} />
                    <input className="settings-input" name="term" placeholder={copy.keywords.addPlaceholder} required style={{ flex: 1 }} />
                    <button type="submit" className="settings-btn-primary" style={{ flexShrink: 0 }}>{copy.keywords.add}</button>
                  </form>
                </div>
              </SettingsSection>

              {billingPlan.xEnabled ? (
                <SettingsSection
                  title={copy.keywords.xTitle}
                  description={copy.keywords.xDescription}
                  badge={copy.keywords.activeBadge(activeXKeywords.length)}
                >
                  <div style={{ display: "grid", gap: 0 }}>
                    {xKeywords.length === 0 ? (
                      <EmptyHint>{copy.keywords.xEmpty}</EmptyHint>
                    ) : (
                      xKeywords.map((keyword) => (
                        <XKeywordRow key={keyword.id} keyword={keyword} projectId={currentProject.id} copy={copy} />
                      ))
                    )}
                  </div>
                  <form action={addXKeywordFromForm} style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <input type="hidden" name="projectId" value={currentProject.id} />
                    <input className="settings-input" name="query" placeholder={copy.keywords.xPlaceholder} required style={{ flex: 1 }} />
                    <button type="submit" className="settings-btn-primary" style={{ flexShrink: 0 }}>{copy.keywords.add}</button>
                  </form>
                  <XQuerySyntaxGuide copy={copy} />
                </SettingsSection>
              ) : (
                <SettingsSection
                  title={copy.keywords.xTitle}
                  description={localeCode === "en" ? "X monitoring is available on Growth and Professional plans." : localeCode === "es" ? "El monitoreo de X está disponible en los planes Growth y Professional." : "O monitoramento de X está disponível nos planos Growth e Professional."}
                >
                  <div style={{ padding: "16px 0", display: "flex", alignItems: "center", gap: 14 }}>
                    <p style={{ fontSize: 13, color: "#7C7C83", flex: 1 }}>
                      {copy.keywords.xLockedDescription}
                    </p>
                    <a
                      href={`/settings?projectId=${currentProject.id}&tab=billing`}
                      style={{
                        display: "inline-block",
                        padding: "8px 16px",
                        background: "#FF4500",
                        color: "#FFF",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {copy.keywords.xUpgrade}
                    </a>
                  </div>
                </SettingsSection>
              )}
            </div>
          )}

          {selectedTab === "prompts" && (
            <PromptsTab
              projectId={currentProject.id}
              defaultReplyLength={(currentProject.reply_length ?? "medium") as "short" | "medium" | "long"}
              defaultTone={currentProject.tone ?? ""}
            />
          )}

          {selectedTab === "notifications" && (
            <SettingsSection
              title={copy.notifications.title}
              description={copy.notifications.description}
            >
              {/* Email */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#B0B0B5", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                  {copy.notifications.email}
                </p>
                <div style={{ padding: "12px 14px", borderRadius: 8, background: "#F8F8F7", border: "1px solid #EEEEED", fontSize: 13, color: "#7C7C83" }}>
                  {copy.notifications.emailDescription}
                </div>
              </div>

              {/* Frequency info */}
              <div style={{ display: "grid", gap: 10 }}>
                <FrequencyRow label={copy.notifications.mentionFetching} value={copy.notifications.everyHours(billingPlan.scrapeIntervalHours)} />
                <FrequencyRow label={copy.notifications.keywordOpportunities} value={copy.notifications.searchWindow(billingPlan.keywordSearchTimeWindow)} />
              </div>
            </SettingsSection>
          )}

          {selectedTab === "billing" && (
            <SettingsSection
              title={copy.billing.title}
              description={copy.billing.description}
            >
              <div className="metric-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginBottom: 18 }}>
                <BillingMetric label={copy.billing.plan} value={billingPlan.label} />
                <BillingMetric label={copy.billing.aiReplies} value={formatLimit(aiReplyUsage.used, billingPlan.maxAiRepliesPerMonth, copy)} />
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <PlanLimit label={copy.billing.redditKeywords} value={formatLimit(redditKeywords.length, billingPlan.maxKeywords, copy)} />
                {billingPlan.xEnabled && (
                  <PlanLimit label={copy.billing.xKeywords} value={formatLimit(activeXKeywords.length, billingPlan.maxXKeywords, copy)} />
                )}
                <PlanLimit label={copy.billing.competitors} value={formatLimit(competitorKeywords.length, billingPlan.maxCompetitors, copy)} />
                <PlanLimit label={copy.billing.ghostwriterThreads} value={formatLimit(0, billingPlan.maxGhostwriterThreads, copy)} />
                <PlanLimit label={copy.billing.teamMembers} value={formatLimit(1, billingPlan.maxTeamMembers, copy)} />
                <PlanLimit label={copy.billing.redditAccounts} value={formatLimit(0, billingPlan.maxRedditAccounts, copy)} />
              </div>

              <div
                style={{
                  marginTop: 20,
                  paddingTop: 18,
                  borderTop: "1px solid #F0F0EE",
                  display: "grid",
                  gap: 12,
                }}
              >
                <p style={{ fontSize: 12, color: "#7C7C83", lineHeight: 1.5 }}>
                  {copy.billing.note}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(["startup", "growth", "professional"] as const).map((planId) => {
                    const isCurrent = billingPlan.plan === planId;
                    const labels: Record<typeof planId, string> = {
                      startup: copy.billing.switchToStartup,
                      growth: copy.billing.upgradeToGrowth,
                      professional: copy.billing.upgradeToProfessional,
                    };

                    return (
                      <form action={beginBillingCheckoutFromForm} key={planId}>
                        <input type="hidden" name="projectId" value={currentProject.id} />
                        <input type="hidden" name="plan" value={planId} />
                        <button
                          type="submit"
                          disabled={isCurrent}
                          style={{
                            border: isCurrent ? "1px solid #DADAD7" : "1px solid #FF4500",
                            background: isCurrent ? "#F7F7F5" : "#FF4500",
                            color: isCurrent ? "#8E8E93" : "#FFFFFF",
                            borderRadius: 8,
                            padding: "9px 14px",
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: isCurrent ? "not-allowed" : "pointer",
                          }}
                        >
                          {isCurrent ? copy.billing.currentPlan(billingPlan.label) : labels[planId]}
                        </button>
                      </form>
                    );
                  })}

                  <form action={openBillingPortalFromForm}>
                    <input type="hidden" name="projectId" value={currentProject.id} />
                    <button
                      type="submit"
                      style={{
                        border: "1px solid #D6D6D3",
                        background: "#FFFFFF",
                        color: "#1C1C1E",
                        borderRadius: 8,
                        padding: "9px 14px",
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {copy.billing.manage}
                    </button>
                  </form>
                </div>
              </div>
            </SettingsSection>
          )}

          {selectedTab === "extension" && (
            <ExtensionSection
              projectId={currentProject.id}
              tokens={extensionTokens}
              copy={copy}
            />
          )}
        </main>
      </div>
    </DashboardShell>
  );
}

/* ─── Section wrapper ─── */

type SettingsTab = "general" | "competitors" | "keywords" | "prompts" | "notifications" | "billing" | "extension";

const SETTINGS_TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: "general", label: "General" },
  { id: "competitors", label: "Competitors" },
  { id: "keywords", label: "Keywords" },
  { id: "prompts", label: "Prompts" },
  { id: "notifications", label: "Notifications" },
  { id: "billing", label: "Billing" },
  { id: "extension", label: "Extension" },
];

function SettingsTabs({
  projectId,
  selectedTab,
  copy,
}: {
  projectId: string;
  selectedTab: SettingsTab;
  copy: SettingsCopy;
}) {
  return (
    <nav
      aria-label={copy.tabsAriaLabel}
      className="panel"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        padding: 6,
        marginBottom: 18,
      }}
    >
      {SETTINGS_TABS.map((tab) => (
        <Link
          key={tab.id}
          href={`/settings?projectId=${projectId}&tab=${tab.id}`}
          className={`filter-pill${selectedTab === tab.id ? " filter-pill-active" : ""}`}
        >
          {copy.tabs[tab.id]}
        </Link>
      ))}
    </nav>
  );
}

function SettingsSection({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "#FFFFFF",
        border: "1px solid #EEEEED",
        borderRadius: 12,
        padding: "22px 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#1A1A1B",
              marginBottom: 3,
            }}
          >
            {title}
          </h2>
          <p style={{ fontSize: 12, color: "#7C7C83", lineHeight: 1.5 }}>{description}</p>
        </div>
        {badge && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#FF4500",
              background: "#FFF3EC",
              border: "1px solid #FFD9AD",
              borderRadius: 6,
              padding: "2px 8px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function FormFooter({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
      <button type="submit" className="settings-btn-primary">
        {label}
      </button>
    </div>
  );
}

function DangerZone({
  projectId,
  projectName,
  copy,
}: {
  projectId: string;
  projectName: string;
  copy: SettingsCopy;
}) {
  return (
    <div
      style={{
        border: "1px solid #FFD1D1",
        background: "#FFF8F8",
        borderRadius: 10,
        padding: "16px 18px",
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, color: "#8F1D1D", marginBottom: 4 }}>
          {copy.dangerZone.title}
        </h3>
        <p style={{ fontSize: 12, color: "#7A3A3A", lineHeight: 1.5 }}>
          {copy.dangerZone.description}
        </p>
      </div>

      <form action={deleteProjectFromForm} style={{ display: "grid", gap: 10 }}>
        <input type="hidden" name="projectId" value={projectId} />
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#7A3A3A" }}>
            {renderDeleteConfirmation(copy.dangerZone.confirm(projectName))}
          </span>
          <input
            className="settings-input"
            name="confirmation"
            placeholder="DELETE"
            required
            autoComplete="off"
          />
        </label>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            style={{
              border: "1px solid #DC2626",
              background: "#DC2626",
              color: "#FFFFFF",
              borderRadius: 8,
              padding: "9px 14px",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {copy.dangerZone.delete}
          </button>
        </div>
      </form>
    </div>
  );
}

function renderDeleteConfirmation(message: string) {
  const [before, ...rest] = message.split("DELETE");
  const after = rest.join("DELETE");
  return (
    <>
      {before}
      <strong>DELETE</strong>
      {after}
    </>
  );
}

/* ─── Form field helpers ─── */

function FieldRow({
  label,
  vertical,
  children,
}: {
  label: string;
  vertical?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={vertical ? undefined : "settings-field-row"}
      style={
        vertical
          ? { display: "flex", flexDirection: "column", gap: 6 }
          : {
              display: "grid",
              gridTemplateColumns: "160px 1fr",
              alignItems: "center",
              gap: 12,
            }
      }
    >
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#7C7C83",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 12,
        color: "#B0B0B5",
        padding: "12px 0",
        marginBottom: 4,
      }}
    >
      {children}
    </p>
  );
}

/* ─── Keyword row ─── */

function KeywordGroup({
  title,
  keywords,
  projectId,
  editable = false,
  copy,
}: {
  title: string;
  keywords: KeywordDTO[];
  projectId: string;
  editable?: boolean;
  copy: SettingsCopy;
}) {
  return (
    <div style={{ marginTop: title === "Suggested by AI" ? 0 : 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: "#1A1A1B" }}>{title}</p>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#7C7C83" }}>{keywords.length}</span>
      </div>
      <div style={{ display: "grid", gap: 0 }}>
        {keywords.length === 0 ? (
          <EmptyHint>{copy.keywordGroup.empty(title)}</EmptyHint>
        ) : (
          keywords.map((keyword) => (
            <KeywordRow key={keyword.id} keyword={keyword} projectId={projectId} editable={editable} copy={copy} />
          ))
        )}
      </div>
    </div>
  );
}

function KeywordRow({
  keyword,
  projectId,
  editable = false,
  copy,
}: {
  keyword: KeywordDTO;
  projectId: string;
  editable?: boolean;
  copy: SettingsCopy;
}) {
  const typeBadgeColor = keyword.type === "ai_suggested" ? "#7C7C83" : "#1A1A1B";
  const typeLabel = keyword.type === "ai_suggested" ? copy.keywordRow.typeAi : keyword.type === "competitor" ? copy.keywordRow.typeComp : copy.keywordRow.typeCustom;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 0",
        borderBottom: "1px solid #EDEFF1",
      }}
    >
      {/* Toggle */}
      <form action={toggleKeywordFromForm} style={{ display: "flex" }}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="keywordId" value={keyword.id} />
        <input type="hidden" name="isActive" value={String(!keyword.is_active)} />
        <button
          type="submit"
          title={keyword.is_active ? copy.keywordRow.pause : copy.keywordRow.enable}
          style={{
            width: 32,
            height: 18,
            borderRadius: 9,
            border: "none",
            cursor: "pointer",
            padding: 0,
            background: keyword.is_active ? "#FF4500" : "#D1D1D6",
            position: "relative",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: keyword.is_active ? 14 : 2,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#FFF",
              transition: "left 0.15s",
            }}
          />
        </button>
      </form>

      {/* Term */}
      {editable ? (
        <form action={updateKeywordFromForm} style={{ display: "flex", gap: 8, flex: 1, minWidth: 0 }}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="keywordId" value={keyword.id} />
          <input
            className="settings-input"
            name="term"
            defaultValue={keyword.term}
            required
            style={{ opacity: keyword.is_active ? 1 : 0.58 }}
          />
          <button type="submit" className="settings-btn-secondary">{copy.keywordRow.save}</button>
        </form>
      ) : (
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 500,
            color: keyword.is_active ? "#1A1A1B" : "#B0B0B5",
          }}
        >
          {keyword.term}
        </span>
      )}

      {/* Type badge */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: typeBadgeColor,
          background: "#EDEFF1",
          borderRadius: 4,
          padding: "2px 6px",
          letterSpacing: "0.02em",
        }}
      >
        {typeLabel}
      </span>

      {/* Intent */}
      {keyword.intent_category && (
        <span
          style={{
            fontSize: 10,
            color: "#7C7C83",
            background: "#EDEFF1",
            borderRadius: 4,
            padding: "2px 6px",
          }}
        >
          {keyword.intent_category}
        </span>
      )}

      {/* Remove */}
      <form action={removeKeywordFromForm}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="keywordId" value={keyword.id} />
        <button
          type="submit"
          title={copy.keywordRow.remove}
          style={{
            width: 24,
            height: 24,
            border: "none",
            background: "transparent",
            color: "#C7C7CC",
            cursor: "pointer",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </form>
    </div>
  );
}

function XKeywordRow({
  keyword,
  projectId,
  copy,
}: {
  keyword: XKeywordDTO;
  projectId: string;
  copy: SettingsCopy;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 0",
        borderBottom: "1px solid #EDEFF1",
      }}
    >
      <form action={toggleXKeywordFromForm} style={{ display: "flex" }}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="keywordId" value={keyword.id} />
        <input type="hidden" name="isActive" value={String(!keyword.is_active)} />
        <button
          type="submit"
          title={keyword.is_active ? copy.xKeywordRow.pause : copy.xKeywordRow.enable}
          style={{
            width: 32,
            height: 18,
            borderRadius: 9,
            border: "none",
            cursor: "pointer",
            padding: 0,
            background: keyword.is_active ? "#111827" : "#D1D1D6",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: keyword.is_active ? 14 : 2,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#FFF",
            }}
          />
        </button>
      </form>

      <form action={updateXKeywordFromForm} style={{ display: "flex", gap: 8, flex: 1, minWidth: 0 }}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="keywordId" value={keyword.id} />
        <input
          className="settings-input"
          name="query"
          defaultValue={keyword.query}
          required
          style={{ opacity: keyword.is_active ? 1 : 0.58, fontFamily: "monospace" }}
        />
        <button type="submit" className="settings-btn-secondary">{copy.xKeywordRow.save}</button>
      </form>

      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "#111827",
          background: "#F3F4F6",
          borderRadius: 4,
          padding: "2px 6px",
          letterSpacing: "0.02em",
        }}
      >
        {copy.xKeywordRow.rule}
      </span>

      <form action={removeXKeywordFromForm}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="keywordId" value={keyword.id} />
        <button
          type="submit"
          title={copy.xKeywordRow.remove}
          style={{
            width: 24,
            height: 24,
            border: "none",
            background: "transparent",
            color: "#C7C7CC",
            cursor: "pointer",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </form>
    </div>
  );
}

/* ─── Notification and billing helpers ─── */

function NotificationChannel({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ fontSize: 18, color: enabled ? "#46A758" : "#7C7C83" }}>
        {enabled ? "Enabled" : "Locked"}
      </div>
    </div>
  );
}

function FrequencyRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid #EDEFF1" }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1B" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color: "#FF4500" }}>{value}</span>
    </div>
  );
}

function BillingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ fontSize: 22 }}>{value}</div>
    </div>
  );
}

function PlanLimit({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: "1px solid #EDEFF1" }}>
      <span style={{ fontSize: 13, color: "#7C7C83", fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#1A1A1B", fontWeight: 800 }}>{value}</span>
    </div>
  );
}

/* ─── X query syntax guide ─── */

function XQuerySyntaxGuide({ copy }: { copy: SettingsCopy }) {
  return (
    <details style={{ marginTop: 18 }}>
      <summary style={{ fontSize: 12, fontWeight: 700, color: "#7C7C83", cursor: "pointer", userSelect: "none", listStyle: "none", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 10 }}>▶</span> {copy.xGuide.title}
      </summary>
      <div style={{ marginTop: 12, borderRadius: 8, border: "1px solid #EDEFF1", overflow: "hidden" }}>
        {copy.xGuide.operators.map(({ op, desc }, i) => (
          <div key={op} style={{ display: "flex", gap: 12, padding: "8px 12px", background: i % 2 === 0 ? "#FAFAFA" : "#FFF", borderTop: i > 0 ? "1px solid #F0F0F0" : undefined }}>
            <code style={{ fontSize: 11, fontFamily: "ui-monospace, Menlo, monospace", color: "#FF4500", whiteSpace: "nowrap", flexShrink: 0 }}>{op}</code>
            <span style={{ fontSize: 12, color: "#7C7C83" }}>{desc}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: "#B0B0B5", marginTop: 8 }}>
        {copy.xGuide.combine} <code style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>crm lang:en -is:retweet min_faves:5</code>
      </p>
    </details>
  );
}

/* ─── Extension section ─── */

function ExtensionSection({
  projectId,
  tokens,
  copy,
}: {
  projectId: string;
  tokens: ExtensionTokenDTO[];
  copy: SettingsCopy;
}) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <ExtensionConnectTokenNotice />

      <SettingsSection
        title={copy.extension.title}
        description={copy.extension.description}
      >
        <form action={generateConnectTokenFromForm}>
          <input type="hidden" name="projectId" value={projectId} />
          <button type="submit" className="settings-btn-primary">
            {copy.extension.generate}
          </button>
        </form>
      </SettingsSection>

      <SettingsSection
        title={copy.extension.sessionsTitle}
        description={copy.extension.sessionsDescription}
        badge={tokens.length > 0 ? copy.extension.activeBadge(tokens.length) : undefined}
      >
        {tokens.length === 0 ? (
          <p style={{ fontSize: 12, color: "#B0B0B5", padding: "8px 0" }}>
            {copy.extension.empty}
          </p>
        ) : (
          <div style={{ display: "grid", gap: 0 }}>
            {tokens.map((token) => (
              <div
                key={token.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: "1px solid #EDEFF1",
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1B" }}>
                    {token.label ?? copy.extension.defaultLabel}
                  </p>
                  <p style={{ fontSize: 11, color: "#7C7C83", marginTop: 2 }}>
                    {copy.extension.connected(formatRelativeDate(token.created_at, copy))}
                    {token.last_used_at && ` · ${copy.extension.lastUsed(formatRelativeDate(token.last_used_at, copy))}`}
                  </p>
                </div>
                <form action={revokeExtensionTokenFromForm}>
                  <input type="hidden" name="tokenId" value={token.id} />
                  <input type="hidden" name="projectId" value={projectId} />
                  <button
                    type="submit"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#DC2626",
                      background: "none",
                      border: "1px solid #FECACA",
                      borderRadius: 6,
                      padding: "4px 10px",
                      cursor: "pointer",
                    }}
                  >
                    {copy.extension.revoke}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>
    </div>
  );
}

function formatRelativeDate(iso: string, copy: SettingsCopy): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return copy.relativeDate.minutesAgo(mins);
  const hours = Math.floor(mins / 60);
  if (hours < 24) return copy.relativeDate.hoursAgo(hours);
  return copy.relativeDate.daysAgo(Math.floor(hours / 24));
}

/* ─── Helpers ─── */

function parseSettingsTab(value: string | undefined): SettingsTab {
  return SETTINGS_TABS.some((tab) => tab.id === value) ? (value as SettingsTab) : "general";
}

function formatLimit(current: number, max: number | null, copy: SettingsCopy) {
  return max === null ? `${current}/${copy.unlimited}` : `${current}/${max}`;
}
