import type { Prisma } from "@prisma/client";

// Public issue IDs look like "TR-1024"; internal tickets like "TR-2026-11024".

export async function nextIssueReference(tx: Prisma.TransactionClient): Promise<string> {
  const [row] = await tx.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(reference FROM 4) AS INTEGER)) AS max FROM "Issue" WHERE reference ~ '^TR-[0-9]+$'`;
  return `TR-${(row?.max ?? 1000) + 1}`;
}

export function ticketReference(issueReference: string, year = new Date().getFullYear()): string {
  const n = parseInt(issueReference.replace(/\D/g, ""), 10);
  return `TR-${year}-${10000 + n}`;
}
