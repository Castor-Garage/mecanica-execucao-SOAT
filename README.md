# Execução/Produção Service - Castor Garage

Microsserviço responsável pela **fila de execução, diagnóstico e reparo**
das Ordens de Serviço da oficina. Parte da Fase 4 (Tech Challenge SOAT -
FIAP), que divide a antiga aplicação única (`mecanica-pos-SOAT`) em 3
microsserviços com Saga Pattern.

> Decisões de arquitetura completas (split em serviços, mensageria,
> Saga, banco por serviço) estão documentadas em
> [`mecanica-pos-SOAT/docs/adr/0006-arquitetura-microsservicos-fase4.md`](https://github.com/Castor-Garage/mecanica-pos-SOAT/blob/main/docs/adr/0006-arquitetura-microsservicos-fase4.md).

## Responsabilidades

- Gerenciar a fila de execução da OS a partir do comando `IniciarExecucao`
  (recebido do OS Service via Amazon SQS, fila `execucao-commands`).
- Atualizar o status durante diagnóstico e reparo.
- Publicar os eventos `ExecucaoFinalizada`/`ExecucaoFalhou` na fila
  `os-events`, consumida pelo orquestrador da saga no OS Service.

Este serviço **não expõe uma API pública** — toda a integração com o OS
Service é assíncrona via SQS. O servidor HTTP existe apenas para o
`/health` exigido pelas probes do Kubernetes.

## Estado atual (scaffold inicial - Fase 1 do backlog)

Este repositório ainda contém apenas a base de infraestrutura/observabilidade
(Fastify, Prisma, logger, tratamento de erros, CI/CD, Docker, Kubernetes),
replicada do padrão já validado em `mecanica-pos-SOAT`. **Ainda faltam** (ver
plano de migração completo no repo principal):

- [ ] Consumer SQS do comando `IniciarExecucao` e publisher dos eventos em `os-events`
- [ ] Use cases de diagnóstico/reparo/finalização
- [ ] Testes unitários dos use cases (cobertura ≥80%)
- [ ] Secrets de produção/staging (`execucao-secret`: `DATABASE_URL`,
      `NEW_RELIC_LICENSE_KEY`)

## Banco de dados

PostgreSQL próprio (ver `prisma/schema.prisma`): `ExecutionQueueItem`.
Nenhuma relação de banco com o OS Service ou o Billing Service — toda
referência entre eles é por id lógico (`serviceOrderId`), recebido via
mensageria.

## Rodar localmente

```bash
cp .env.example .env
npm install
npm run db:generate
npm run dev
```

Requer um PostgreSQL local (`DATABASE_URL` no `.env`) para os comandos
`db:*` e para os testes de integração.

```bash
# Testes
npm run test:unit
npm run test:integration   # requer Postgres rodando, ver vitest.integration.config.ts
npm run test:coverage
```

## Docker

```bash
docker build -t mecanica-execucao-soat .
```

## CI/CD

Pipeline em `.github/workflows/pipeline.yml`: testes (unitários +
integração) → SonarCloud → build/push da imagem (GHCR) → deploy via
kustomize no cluster EKS já usado pelo OS Service (`mecanica-k8s-infra-SOAT`),
namespaces `castor-garage-staging`/`castor-garage-production`.

Secrets necessários no repositório (GitHub Actions): `AWS_ACCESS_KEY_ID`,
`AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `NEW_RELIC_LICENSE_KEY`,
`SONAR_TOKEN`.

## Saga Pattern

Este serviço participa da saga **orquestrada pelo OS Service** (não há
orquestrador próprio aqui). Ver ADR 0006 no repositório principal para o
fluxo completo e a estratégia de compensação em caso de falha na execução.
