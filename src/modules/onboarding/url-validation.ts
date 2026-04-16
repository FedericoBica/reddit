const URL_TIMEOUT_MS = 7000;

export type ValidatedWebsite = {
  url: string;
  hostname: string;
};

export async function validateAccessibleWebsite(rawUrl: string): Promise<ValidatedWebsite> {
  const url = normalizeUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), URL_TIMEOUT_MS);

  try {
    let response = await fetch(url.toString(), {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });

    if (response.status === 405 || response.status === 403) {
      response = await fetch(url.toString(), {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
      });
    }

    if (!response.ok) {
      throw new Error(`URL returned ${response.status}`);
    }

    return {
      url: response.url || url.toString(),
      hostname: new URL(response.url || url.toString()).hostname.replace(/^www\./i, ""),
    };
  } catch {
    throw new Error("La URL debe ser válida y accesible públicamente.");
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeUrl(rawUrl: string): URL {
  const text = rawUrl.trim();

  if (!text) {
    throw new Error("Ingresá una URL.");
  }

  const withProtocol = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  let url: URL;

  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error("Ingresá una URL válida.");
  }

  if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) {
    throw new Error("Ingresá una URL válida.");
  }

  return url;
}

export function generateCompanyDescription(hostname: string) {
  const name = hostname
    .replace(/\.[a-z]{2,}$/i, "")
    .split(/[.-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return `${name || hostname} ayuda a clientes a resolver un problema específico con una solución digital. ReddProwl usará esta descripción para detectar conversaciones con intención de compra, comparaciones y pedidos de recomendación en Reddit.`;
}
