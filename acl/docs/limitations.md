# Limitações conhecidas da ACL

## JWT do legado sem renovação automática

Nesta versão, a ACL gera um JWT compatível com o Sistema de Horários usando o mesmo formato do login local:

```js
{ id, name, role }
```

O token expira em 8 horas, igual ao comportamento atual do legado. O sistema legado não possui refresh token nem endpoint `/refresh`; quando o token expira, o frontend redireciona para `/login`.

Mitigação atual: o usuário deve voltar ao Painel Integrador e relançar o módulo de Horários dos Professores.

## Estratégia futura de renovação silenciosa

Uma evolução recomendada é manter a renovação sob controle da ACL, sem modificar profundamente o legado:

1. A ACL cria uma sessão server-side em Redis, indexada por cookie `acl_sid` HttpOnly.
2. Essa sessão guarda o refresh token do Keycloak, não um refresh token do legado.
3. O JWT legado pode passar a ter TTL menor, por exemplo 15 minutos.
4. Um script de bridge agenda uma renovação silenciosa antes da expiração.
5. A renovação chama um endpoint da ACL em iframe oculto.
6. A ACL usa o refresh token do Keycloak, valida a sessão SSO, gera novo JWT legado e envia o novo token ao SPA via `postMessage`.
7. Se o refresh token do Keycloak estiver expirado ou revogado, a ACL redireciona para o login SSO.

Essa estratégia mantém o legado ignorando completamente refresh tokens e concentra o estado de sessão no BFF/ACL.

## Limitações de segurança atuais

- O JWT legado trafega temporariamente na URL da bridge page.
- A bridge page remove os parâmetros com `history.replaceState`, mas logs de proxy ainda podem registrar a primeira URL.
- O `JWT_SECRET` é compartilhado entre ACL e legado por variável de ambiente.

Em produção, esses segredos devem vir de vault e a URL de bridge deve ser protegida por TLS.
