import { NextRequest, NextResponse } from "next/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments || "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});
const plaid = new PlaidApi(config);

const plaidCategoryMap: Record<string, string> = {
  "Food and Drink": "food",
  "Travel": "transport",
  "Transportation": "transport",
  "Payment": "utilities",
  "Recreation": "entertainment",
  "Shops": "other",
  "Transfer": "income",
  "Deposit": "income",
  "Income": "income",
};

function mapCategory(plaidCategory: string[] | null | undefined): string {
  if (!plaidCategory || plaidCategory.length === 0) return "other";
  const top = plaidCategory[0];
  return plaidCategoryMap[top] || "other";
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { access_token } = await req.json();
  if (!access_token) return NextResponse.json({ error: "No access token" }, { status: 400 });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const res = await plaid.transactionsGet({
    access_token,
    start_date: thirtyDaysAgo.toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  });

  let upserted = 0;
  for (const t of res.data.transactions) {
    const category = mapCategory(t.category);
    const isIncome = t.amount < 0;
    await prisma.transaction.upsert({
      where: { plaidTransactionId: t.transaction_id },
      create: {
        amount: Math.abs(t.amount),
        date: new Date(t.date),
        description: t.name,
        category,
        merchantName: t.merchant_name || null,
        plaidTransactionId: t.transaction_id,
        type: isIncome ? "income" : "expense",
      },
      update: { amount: Math.abs(t.amount), category, merchantName: t.merchant_name || null },
    });
    upserted++;
  }

  return NextResponse.json({ synced: upserted });
}
