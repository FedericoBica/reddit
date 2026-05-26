export type LocaleCode = "en" | "es" | "pt";

export type SettingsTab = "general" | "competitors" | "keywords" | "prompts" | "notifications" | "billing" | "extension";

export type SettingsCopy = {
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
    emailToggleLabel: string;
    emailToggleOn: string;
    emailToggleOff: string;
    save: string;
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

export const SETTINGS_TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: "general", label: "General" },
  { id: "competitors", label: "Competitors" },
  { id: "keywords", label: "Keywords" },
  { id: "prompts", label: "Prompts" },
  { id: "notifications", label: "Notifications" },
  { id: "billing", label: "Billing" },
  { id: "extension", label: "Extension" },
];

export const SETTINGS_COPY: Record<LocaleCode, SettingsCopy> = {
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
      emailToggleLabel: "Email notifications",
      emailToggleOn: "Enabled",
      emailToggleOff: "Disabled",
      save: "Save",
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
      note: "Upgrades redirect to a Paddle-hosted checkout. Existing customers can manage renewals, payment methods and cancellations in the customer portal.",
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
      emailToggleLabel: "Notificaciones por email",
      emailToggleOn: "Activado",
      emailToggleOff: "Desactivado",
      save: "Guardar",
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
      note: "Los upgrades redirigen a un checkout alojado en Paddle. Los clientes existentes pueden gestionar renovaciones, medios de pago y cancelaciones desde el portal del cliente.",
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
      emailToggleLabel: "Notificações por e-mail",
      emailToggleOn: "Ativado",
      emailToggleOff: "Desativado",
      save: "Salvar",
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
      note: "Os upgrades redirecionam para um checkout hospedado no Paddle. Clientes existentes podem gerenciar renovações, formas de pagamento e cancelamentos no portal do cliente.",
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

export function parseSettingsTab(value: string | undefined): SettingsTab {
  return SETTINGS_TABS.some((tab) => tab.id === value) ? (value as SettingsTab) : "general";
}

export function formatLimit(current: number, max: number | null, copy: SettingsCopy) {
  return max === null ? `${current}/${copy.unlimited}` : `${current}/${max}`;
}
