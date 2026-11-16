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
  (recebido do OS Service, fila `execucao-commands`) — cria o item já em
  diagnóstico.
- Avançar o status durante diagnóstico/reparo via o comando `AvancarExecucao`
  (um passo por chamada: diagnóstico → execução → finalizada), a pedido do
  mecânico/admin pelo OS Service.
- Registrar falha via `FalharExecucao` quando o reparo não pode ser concluído.
- Publicar os eventos `ExecucaoFinalizada`/`ExecucaoFalhou` na fila
  `os-events`, consumida pelo orquestrador da saga no OS Service.

Este serviço **não expõe uma API pública** — toda a integração com o OS
Service é assíncrona via mensageria. O servidor HTTP existe apenas para o
`/health` exigido pelas probes do Kubernetes.

## Estado atual (Fase 3 do backlog concluída)

- [x] Consumer dos comandos `IniciarExecucao`/`AvancarExecucao`/`FalharExecucao`
      e publisher dos eventos em `os-events` — hoje sobre `InMemoryMessageBus`
      (porta `IMessageBus`), SQS real entra na Fase 5 sem mudar os use cases
- [x] Use cases de diagnóstico/reparo/finalização (`StartExecutionUseCase`,
      `AdvanceExecutionUseCase`, `FailExecutionUseCase`)
- [x] Testes unitários dos use cases: 44 testes, ~97% de cobertura em
      domínio/aplicação
- [ ] 1 fluxo completo testado com BDD (ponta a ponta com os 3 serviços)
- [x] Secrets de produção/staging: `execucao-secret` montado pelo pipeline a
      partir do SSM Parameter Store (ver [CI/CD](#cicd))
- [x] Migration inicial do Prisma (`prisma/migrations/*_init`)

## Banco de dados

PostgreSQL próprio (ver `prisma/schema.prisma`): `ExecutionQueueItem`.
Nenhuma relação de banco com o OS Service ou o Billing Service — toda
referência entre eles é por id lógico (`serviceOrderId`), recebido via
mensageria. A instância RDS é provisionada em
[`mecanica-db-infra-SOAT`](https://github.com/Castor-Garage/mecanica-db-infra-SOAT).

As migrations ficam em `prisma/migrations/` e são aplicadas pelo próprio
container ao subir (`prisma migrate deploy` no `CMD` do Dockerfile). Para
mudar o schema: edite `schema.prisma` e rode `npm run db:migrate` com um
Postgres local, que gera a nova migration.

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

### Secret do Kubernetes (`execucao-secret`)

Nada é criado à mão no cluster: a cada deploy o pipeline monta o
`execucao-secret` lendo o SSM Parameter Store, e o step falha se algum
parâmetro não existir.

| Chave | Origem |
|---|---|
| `DATABASE_URL` | SSM `/castor-garage/execucao/database-url` (`-staging` em staging) — `mecanica-db-infra-SOAT` |
| `SQS_EXECUCAO_COMMANDS_QUEUE_URL`, `SQS_OS_EVENTS_QUEUE_URL` | SSM `/castor-garage/queues/*-url` — `mecanica-k8s-infra-SOAT` (só em produção) |
| `NEW_RELIC_LICENSE_KEY` | secret do GitHub |

Staging não recebe URLs de fila: só existe um conjunto de filas SQS e um
consumer de staging roubaria mensagens da saga de produção. As credenciais
AWS para SQS não vão no Secret: os pods usam a LabRole dos nodes do EKS.

**Ordem de deploy**: o `terraform apply` de `mecanica-k8s-infra-SOAT`
(cluster + filas) e de `mecanica-db-infra-SOAT` (banco) precisa ter rodado
antes do primeiro deploy deste serviço.

## Saga Pattern

Este serviço participa da saga **orquestrada pelo OS Service** (não há
orquestrador próprio aqui). Ver ADR 0006 no repositório principal para o
fluxo completo e a estratégia de compensação em caso de falha na execução.
