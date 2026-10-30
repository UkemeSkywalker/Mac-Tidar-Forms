import ExcelJS from "exceljs";
import { currentUser, ownedForm } from "@/lib/auth";
import { fail } from "@/lib/http";
import { fileName, toCsv, toSheet } from "@/lib/sheet";
import { store } from "@/lib/store";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return fail(401, "Sign in first.");
  const form = await ownedForm((await params).id, user);
  if (!form) return fail(404, "Form not found.");

  const { header, rows } = toSheet(form, await store().listResponses(form.id));
  const format = new URL(req.url).searchParams.get("format");

  if (format === "csv") {
    return new Response(`﻿${toCsv(header, rows)}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName(form.title, "csv")}"`,
      },
    });
  }

  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Responses", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.addRow(header).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));
  sheet.columns.forEach((column) => (column.width = 24));
  return new Response(await book.xlsx.writeBuffer(), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName(form.title, "xlsx")}"`,
    },
  });
}
