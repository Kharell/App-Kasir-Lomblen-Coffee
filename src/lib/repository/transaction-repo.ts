import { connectDB, withDatabase } from "@/lib/db";
import { buildReport, getDemoStore, nextInvoiceNo } from "@/lib/demo-store";
import { generateInvoiceNo } from "@/lib/utils";
import { TransactionModel } from "@/models/Transaction";
import type {
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
  ReportSummary,
  Transaction,
} from "@/types";

/** Repository Transaction: pembuatan, void, query shift, agregasi laporan. */

function normalize(doc: Record<string, unknown>): Transaction {
  return {
    _id: String(doc._id),
    invoiceNo: String(doc.invoiceNo),
    customerName: doc.customerName ? String(doc.customerName) : undefined,
    tableNo: doc.tableNo ? String(doc.tableNo) : undefined,
    lines: (doc.lines as Transaction["lines"]) ?? [],
    totals: doc.totals as Transaction["totals"],
    paymentMethod: doc.paymentMethod as PaymentMethod,
    paymentStatus: doc.paymentStatus as PaymentStatus,
    status: doc.status as OrderStatus,
    paidAmount: doc.paidAmount != null ? Number(doc.paidAmount) : undefined,
    changeAmount: doc.changeAmount != null ? Number(doc.changeAmount) : undefined,
    cashierId: String(doc.cashierId),
    cashierName: String(doc.cashierName),
    note: doc.note ? String(doc.note) : undefined,
    createdAt: new Date(doc.createdAt as string | Date).toISOString(),
    paidAt: doc.paidAt ? new Date(doc.paidAt as string | Date).toISOString() : undefined,
  };
}

export interface CreateTransactionInput {
  lines: Transaction["lines"];
  totals: Transaction["totals"];
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  status?: OrderStatus;
  paidAmount?: number;
  changeAmount?: number;
  cashierId: string;
  cashierName: string;
  customerName?: string;
  tableNo?: string;
  note?: string;
}

export async function createTransaction(
  input: CreateTransactionInput
): Promise<Transaction> {
  const now = new Date();

  return withDatabase(
    async () => {
      const countToday = await TransactionModel.countDocuments({
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
      });
      const doc = await TransactionModel.create({
        ...input,
        invoiceNo: generateInvoiceNo(now, countToday + 1),
        paymentStatus: input.paymentStatus ?? "paid",
        status: input.status ?? "paid",
        paidAt: now,
      });
      return normalize(doc.toObject() as unknown as Record<string, unknown>);
    },
    async () => {
      const store = getDemoStore();
      const doc: Transaction = {
        _id: `trx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        invoiceNo: nextInvoiceNo(store.transactions),
        customerName: input.customerName,
        tableNo: input.tableNo,
        lines: input.lines,
        totals: input.totals,
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentStatus ?? "paid",
        status: input.status ?? "paid",
        paidAmount: input.paidAmount,
        changeAmount: input.changeAmount,
        cashierId: input.cashierId,
        cashierName: input.cashierName,
        note: input.note,
        createdAt: now.toISOString(),
        paidAt: now.toISOString(),
      };
      store.transactions.push(doc);
      return { ...doc };
    }
  );
}

/** Pembatalan transaksi (void). Hanya Manajer/Admin. */
export async function voidTransaction(
  id: string,
  reason: string
): Promise<Transaction | null> {
  return withDatabase(
    async () => {
      const doc = await TransactionModel.findByIdAndUpdate(
        id,
        { status: "void", note: reason },
        { new: true }
      ).lean();
      return doc ? normalize(doc as unknown as Record<string, unknown>) : null;
    },
    async () => {
      const { transactions } = getDemoStore();
      const trx = transactions.find((t) => t._id === id);
      if (!trx) return null;
      trx.status = "void";
      trx.note = reason;
      return { ...trx };
    }
  );
}

export async function listTransactions(options?: {
  limit?: number;
  status?: OrderStatus;
}): Promise<Transaction[]> {
  const { limit = 50, status } = options ?? {};

  return withDatabase(
    async () => {
      const filter = status ? { status } : {};
      const docs = await TransactionModel.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      return docs.map((d) => normalize(d as unknown as Record<string, unknown>));
    },
    async () => {
      const { transactions } = getDemoStore();
      return transactions
        .filter((t) => (status ? t.status === status : true))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, limit)
        .map((t) => ({ ...t }));
    }
  );
}

/**
 * Laporan harian. Agregasi di database bila MongoDB aktif,
 * agregasi in-memory bila mode demo.
 */
export async function getDailyReport(dateInput?: string): Promise<ReportSummary> {
  const date = dateInput ? new Date(dateInput) : new Date();
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

  const conn = await connectDB();
  if (!conn) {
    return buildReport(getDemoStore().transactions, start.toDateString());
  }
try {
    const paidMatch = {
      createdAt: { $gte: start, $lt: end },
      status: "paid" as const,
    };

    const [agg] = await TransactionModel.aggregate([
      { $match: paidMatch },
      {
        $group: {
          _id: null,
          transactionCount: { $sum: 1 },
          grossRevenue: { $sum: "$totals.subtotal" },
          discountTotal: { $sum: "$totals.discount" },
          netRevenue: { $sum: "$totals.total" },
        },
      },
    ]);

    const byMethodRows = await TransactionModel.aggregate([
      { $match: paidMatch },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          total: { $sum: "$totals.total" },
        },
      },
    ]);

    const topItems = await TransactionModel.aggregate([
      { $match: paidMatch },
      { $unwind: "$lines" },
      {
        $group: {
          _id: "$lines.name",
          qty: { $sum: "$lines.qty" },
          revenue: { $sum: { $multiply: ["$lines.qty", "$lines.price"] } },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 8 },
    ]);

    const voidCount = await TransactionModel.countDocuments({
      createdAt: { $gte: start, $lt: end },
      status: "void",
    });

    const byMethod = {
      cash: { count: 0, total: 0 },
      qris: { count: 0, total: 0 },
      ewallet: { count: 0, total: 0 },
      va: { count: 0, total: 0 },
    };
    for (const row of byMethodRows) {
      const key = row._id as PaymentMethod;
      if (key in byMethod) byMethod[key] = { count: row.count, total: row.total };
    }

    const transactionCount = agg?.transactionCount ?? 0;
    const netRevenue = agg?.netRevenue ?? 0;

    return {
      date: start.toDateString(),
      transactionCount,
      grossRevenue: agg?.grossRevenue ?? 0,
      discountTotal: agg?.discountTotal ?? 0,
      netRevenue,
      averageTicket: transactionCount ? Math.round(netRevenue / transactionCount) : 0,
      voidCount,
      byMethod,
      topItems: topItems.map((r) => ({ name: r._id, qty: r.qty, revenue: r.revenue })),
    };
  } catch (err) {
    console.warn("[report] agregasi MongoDB gagal, memakai data in-memory:", err);
    return buildReport(getDemoStore().transactions, start.toDateString());
  }
}