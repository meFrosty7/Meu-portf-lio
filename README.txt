ETHERNALS BEDROCK — V12 STATUS REAL

CORREÇÃO PRINCIPAL
A versão anterior ocultava a mensagem de gateway do Aternos, mas ainda
aceitava aquela resposta como ONLINE.

Agora uma resposta só conta como ONLINE quando:
- a API informa online=true;
- o MOTD NÃO contém Offline Aternos;
- o MOTD NÃO contém aternos.org/connect / Connect to...;
- existe um limite máximo de jogadores válido (> 0).

Se o Aternos responder através do proxy/fallback, o site mostra OFFLINE.

FONTES
- SnowDev
- mcstatus.io

As duas são consultadas ao mesmo tempo.
Se alguma delas confirmar um servidor real online, aparece ONLINE.
Se nenhuma confirmar online e alguma indicar offline/fallback, aparece OFFLINE.

PARA GITHUB + VERCEL
Substitua apenas o index.html pelo desta versão e faça Commit.
