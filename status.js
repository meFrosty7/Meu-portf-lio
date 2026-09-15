const SERVER = 'Ethernals.aternos.me:12701';

const PROVIDERS = [
  {
    name: 'mcstatus.io',
    url: `https://api.mcstatus.io/v2/status/bedrock/${encodeURIComponent(SERVER)}?timeout=5`,
    parse(data) {
      return {
        online: Boolean(data?.online),
        playersOnline: Number(data?.players?.online ?? 0),
        playersMax: data?.players?.max ?? null,
        motd: normalizeText(data?.motd?.clean ?? data?.motd?.raw ?? '')
      };
    }
  },
  {
    name: 'mcsrvstat.us',
    url: `https://api.mcsrvstat.us/bedrock/3/${encodeURIComponent(SERVER)}`,
    parse(data) {
      return {
        online: Boolean(data?.online),
        playersOnline: Number(data?.players?.online ?? 0),
        playersMax: data?.players?.max ?? null,
        motd: normalizeText(data?.motd?.clean ?? '')
      };
    }
  },
  {
    name: 'SnowDev',
    url: `https://mcstatus.snowdev.com.br/api/query/v3/${encodeURIComponent(SERVER)}`,
    parse(data) {
      return {
        online: Boolean(data?.online),
        playersOnline: Number(
          data?.players?.online ??
          data?.players?.now ??
          data?.onlinePlayers ??
          0
        ),
        playersMax:
          data?.players?.max ??
          data?.maxPlayers ??
          null,
        motd: normalizeText(data?.motd?.clean ?? data?.motd ?? '')
      };
    }
  }
];

function normalizeText(value) {
  if (Array.isArray(value)) {
    return value.join(' ').replace(/\s+/g, ' ').trim();
  }

  if (value && typeof value === 'object') {
    if (Array.isArray(value.clean)) {
      return value.clean.join(' ').replace(/\s+/g, ' ').trim();
    }
    if (typeof value.clean === 'string') {
      return value.clean.replace(/\s+/g, ' ').trim();
    }
    return '';
  }

  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeForMatch(value) {
  return normalizeText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function explicitlyOffline(motd) {
  const text = normalizeForMatch(motd);

  return [
    'offline aternos',
    'aternos offline',
    'server is offline',
    'server offline',
    'servidor offline',
    'servidor esta offline',
    'servidor desligado'
  ].some(term => text.includes(term));
}

async function fetchWithTimeout(url, timeoutMs = 6500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EthernalsBedrock-Status/1.0'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function queryProvider(provider) {
  const raw = await fetchWithTimeout(provider.url);
  const parsed = provider.parse(raw);

  return {
    provider: provider.name,
    ...parsed,
    explicitOffline: explicitlyOffline(parsed.motd)
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const settled = await Promise.allSettled(
    PROVIDERS.map(queryProvider)
  );

  const results = settled
    .filter(item => item.status === 'fulfilled')
    .map(item => item.value);

  if (results.length === 0) {
    return res.status(503).json({
      online: null,
      detail: 'Nenhuma fonte de status respondeu',
      sources: []
    });
  }

  // Cada fonte vira um voto. Um MOTD "Offline Aternos" nunca conta como online.
  const votes = results.map(result => ({
    ...result,
    verdict: result.explicitOffline
      ? 'offline'
      : (result.online ? 'online' : 'offline')
  }));

  const onlineVotes = votes.filter(v => v.verdict === 'online');
  const offlineVotes = votes.filter(v => v.verdict === 'offline');

  // Com empate, preferimos OFFLINE para não exibir um falso positivo.
  const isOnline = onlineVotes.length > offlineVotes.length;

  if (!isOnline) {
    const explicit = offlineVotes.find(v => v.explicitOffline);

    return res.status(200).json({
      online: false,
      detail: explicit
        ? 'Servidor desligado no Aternos'
        : 'Servidor offline',
      playersOnline: 0,
      playersMax: null,
      motd: explicit?.motd || '',
      sources: votes.map(v => ({
        provider: v.provider,
        verdict: v.verdict
      }))
    });
  }

  // Usa a fonte online com dados de jogadores mais completos.
  const best =
    onlineVotes.find(v => v.playersMax !== null && v.playersMax !== undefined) ||
    onlineVotes[0];

  return res.status(200).json({
    online: true,
    playersOnline: best.playersOnline ?? 0,
    playersMax: best.playersMax ?? null,
    motd: best.motd || 'Ethernals Bedrock • Minecraft Bedrock',
    provider: best.provider,
    sources: votes.map(v => ({
      provider: v.provider,
      verdict: v.verdict
    }))
  });
}
