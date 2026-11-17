-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('AGUARDANDO', 'EM_DIAGNOSTICO', 'EM_EXECUCAO', 'FINALIZADA', 'FALHOU');

-- CreateTable
CREATE TABLE "execution_queue_items" (
    "id" TEXT NOT NULL,
    "service_order_id" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'AGUARDANDO',
    "diagnosis" TEXT,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "execution_queue_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "execution_queue_items_service_order_id_idx" ON "execution_queue_items"("service_order_id");

