-- CreateEnum
CREATE TYPE "public"."LinkPrecedence" AS ENUM ('primary', 'secondary');

-- CreateTable
CREATE TABLE "public"."Contact" (
    "id" SERIAL NOT NULL,
    "phoneNumber" VARCHAR(50),
    "email" VARCHAR(255),
    "linkedId" INTEGER,
    "linkPrecedence" "public"."LinkPrecedence" NOT NULL DEFAULT 'primary',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_contact_email" ON "public"."Contact"("email");

-- CreateIndex
CREATE INDEX "idx_contact_phone" ON "public"."Contact"("phoneNumber");

-- CreateIndex
CREATE INDEX "idx_contact_linkedId" ON "public"."Contact"("linkedId");

-- AddForeignKey
ALTER TABLE "public"."Contact" ADD CONSTRAINT "Contact_linkedId_fkey" FOREIGN KEY ("linkedId") REFERENCES "public"."Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
