# Portal Integrador

Portal Integrador e um projeto academico de TCC que demonstra a integracao de sistemas universitarios legados com uma arquitetura moderna baseada em SSO, BFF, API Gateway e camada anticorrupcao.

O sistema legado integrado e o Sistema para Elaboracao de Horarios dos Professores do IFCE Campus Cedro. Ele continua usando sua autenticacao local, enquanto o Portal autentica usuarios pelo Keycloak e troca a identidade SSO por um JWT compativel com o legado.

## Arquitetura

Componentes principais:

- **Portal Shell**: frontend React + Vite em `microfrontends/portal/mfc`.
- **BFF do Portal**: API Express em `microfrontends/portal/bff`.
- **Microfrontend Angular demonstrativo**: aplicacao em `microfrontends/angular-demo/mfc`.
- **BFF Angular**: API propria do microfrontend em `microfrontends/angular-demo/bff`.
- **Kong API Gateway**: gateway interno em `api-gateway/kong`.
- **ACL de Horarios**: camada anticorrupcao em `legados/horarios/acl`.
- **Sistema legado de horarios**: frontend, backend e banco em `legados/horarios/sistema`.
- **Professor Complements Service**: microsservico complementar em `microservices/professor-complements`.
- **Keycloak**: provedor SSO em `sso/keycloak`.

Fluxo resumido de acesso ao legado:

```text
Portal Shell -> BFF -> Kong -> ACL -> Backend legado
                         |
                         v
                 JWT Keycloak validado
```

A ACL valida o token SSO, localiza o usuario correspondente no legado por e-mail e gera um JWT legado. Em seguida, a pagina `auth-bridge` grava os dados esperados pelo frontend legado no `localStorage`.

## Pre-requisitos

- Docker
- Docker Compose
- Git

Nao e necessario instalar Node.js localmente para subir a stack principal, pois os servicos sao executados em containers.

## Como executar

Na raiz do repositorio:

```bash
docker compose up -d --build
```

Depois de subir os containers, acesse:

- Portal: http://localhost:9000
- BFF do Portal: http://localhost:4000
- ACL / sistema legado: http://localhost:8080
- Keycloak: http://localhost:8180
- Microfrontend Angular: http://localhost:4201
- BFF Angular: http://localhost:4101

## Usuarios de demonstracao

O realm `university` do Keycloak inclui usuarios de demonstracao:

- `professor.demo`
- `coordenador.demo`
- `admin.demo`
- `diren.demo`

O login deve comecar pelo Portal em http://localhost:9000. O Portal usa o cliente publico `painel-integrador` e o realm `university`.

## Comandos uteis

Ver o status dos containers:

```bash
docker compose ps
```

Validar o health check do BFF:

```bash
docker compose exec -T bff wget -qO- http://localhost:4000/health
```

Validar o Kong:

```bash
docker compose exec -T kong kong health
```

Validar o Portal dentro do container:

```bash
docker compose exec -T portal wget -qO- http://127.0.0.1:9000
```

Executar o build do Portal:

```bash
docker compose exec -T portal npm run build
```

Consultar a quantidade de horarios carregados no banco legado:

```bash
docker compose exec -T legacy-db mysql -uhorario_user -phorario_password horario_professor_dev -e "SELECT COUNT(*) AS hour_grid FROM hour_grid;"
```

## Recriando Keycloak e Kong

Se o Keycloak for recriado, reinicie o Kong para regenerar a configuracao com a chave publica atual do realm:

```bash
docker compose up -d --force-recreate keycloak
docker compose restart kong
```

## Configuracoes importantes

- O Keycloak publico do navegador deve ser `http://localhost:8180`.
- Dentro do Docker, BFF e ACL devem acessar o Keycloak por `http://keycloak:8080`.
- O Kong e interno e nao deve ser exposto diretamente ao host.
- O `legacy-client`, `legacy-server` e `legacy-db` tambem devem permanecer internos.
- A integracao SSO -> legado depende do e-mail do usuario no Keycloak existir em `users.email` no banco legado.

## Estrutura do projeto

```text
api-gateway/kong/                    Kong em modo DB-less
docs/                                Documentacao academica e decisoes de arquitetura
legados/horarios/acl/                ACL do sistema de horarios
legados/horarios/sistema/            Sistema legado de horarios
microfrontends/angular-demo/         Microfrontend Angular e seu BFF
microfrontends/portal/               Portal Shell e BFF principal
microservices/professor-complements/ Microsservico de complementos de professores
sso/keycloak/                        Realm e configuracao do Keycloak
docker-compose.yml                   Orquestracao local da stack
```

## Observacoes para desenvolvimento

- Execute operacoes de banco e seeds sempre via Docker.
- Evite alterar as URLs internas e publicas do Keycloak sem revisar o fluxo de login.
- Preserve os modos de resposta da ACL: redirect HTML para compatibilidade e JSON para uso pelo BFF.
- Decisoes que mudem a narrativa arquitetural do TCC devem ser documentadas em `docs/`.
