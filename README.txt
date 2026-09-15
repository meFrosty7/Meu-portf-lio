ETHERNALS BEDROCK — V10 STATUS CORRIGIDO

CORREÇÃO:
- SnowDev agora é a fonte principal.
- mcstatus.io é usado para confirmar quando a primeira fonte diz offline.
- Se QUALQUER uma das duas fontes atuais confirmar online corretamente,
  o site mostra SERVIDOR ONLINE.
- "Offline Aternos" só vale para a fonte que devolveu essa mensagem;
  uma resposta velha não derruba outra fonte que já confirmou ONLINE.
- Removida a mcsrvstat.us do site porque ela pode ficar vários minutos em cache.
- Atualização automática a cada 30 segundos.
- Botão Atualizar continua funcionando.
- Sem música.
- Sem /api/status.

PARA VERCEL + GITHUB:
Substitua no repositório:
1. index.html
2. ethernals-icon.png (se necessário)

Faça Commit. A Vercel fará o deploy automaticamente.
