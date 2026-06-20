# ACL do Portal Integrador

ACL responsável por integrar o Painel Integrador ao Sistema de Horários dos Professores.

Fluxo principal:

1. Recebe `GET /sistema/horarios-professores/auth/exchange?sso_token=<token>`.
2. Valida o token no Keycloak via introspection.
3. Resolve o usuário no legado por email.
4. Gera JWT compatível com o legado.
5. Redireciona para `/auth-bridge` para popular o `localStorage`.
6. Proxia `/api/*` para o backend legado e `/*` para o frontend legado.

## Desenvolvimento

```bash
docker compose up --build
```

ACL local: `http://localhost:8080`

Keycloak local: `http://localhost:8180` (`admin` / `admin`)
