import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, Sport } from "@prisma/client";

function adminOnly(role?: string) { return role !== UserRole.ADMIN; }

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const values: string[] = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { values.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    values.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

const VALID_SPORTS = Object.values(Sport) as string[];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!file.name.endsWith(".csv")) return NextResponse.json({ error: "Only CSV files are supported" }, { status: 400 });

  const text = await file.text();
  const rows = parseCSV(text);

  if (!rows.length) return NextResponse.json({ error: "CSV is empty or has no data rows" }, { status: 400 });

  const results: { row: number; status: "created" | "skipped" | "error"; name?: string; reason?: string }[] = [];
  let created = 0, skipped = 0, errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    try {
      const name = row.name?.trim();
      if (!name) { results.push({ row: rowNum, status: "error", reason: "Missing name" }); errors++; continue; }

      const sport = row.sport?.trim().toUpperCase();
      if (!sport || !VALID_SPORTS.includes(sport)) {
        results.push({ row: rowNum, status: "error", name, reason: `Invalid sport: "${row.sport}". Valid: ${VALID_SPORTS.join(", ")}` });
        errors++; continue;
      }

      const description = row.description?.trim();
      if (!description) { results.push({ row: rowNum, status: "error", name, reason: "Missing description" }); errors++; continue; }

      const sku = row.sku?.trim();
      if (!sku) { results.push({ row: rowNum, status: "error", name, reason: "Missing SKU" }); errors++; continue; }

      const price = parseFloat(row.price);
      const mrp = parseFloat(row.mrp ?? row.price);
      if (isNaN(price) || price <= 0) { results.push({ row: rowNum, status: "error", name, reason: "Invalid price" }); errors++; continue; }

      const stock = parseInt(row.stock ?? "0");
      const slug = slugify(name);

      const [existingSlug, existingSku, category] = await Promise.all([
        prisma.product.findUnique({ where: { slug }, select: { id: true } }),
        prisma.productVariant.findUnique({ where: { sku }, select: { id: true } }),
        row.categoryId
          ? prisma.category.findUnique({ where: { id: row.categoryId }, select: { id: true } })
          : prisma.category.findFirst({ where: { isActive: true }, select: { id: true }, orderBy: { sortOrder: "asc" } }),
      ]);

      if (existingSlug) { results.push({ row: rowNum, status: "skipped", name, reason: "Product with this slug already exists" }); skipped++; continue; }
      if (existingSku) { results.push({ row: rowNum, status: "skipped", name, reason: `SKU "${sku}" already exists` }); skipped++; continue; }
      if (!category) { results.push({ row: rowNum, status: "error", name, reason: "No valid category found" }); errors++; continue; }

      await prisma.product.create({
        data: {
          name,
          slug,
          description,
          sport: sport as Sport,
          categoryId: category.id,
          isActive: row.isActive !== "false",
          isFeatured: row.isFeatured === "true",
          isOfficialLicensed: row.isOfficialLicensed === "true",
          teamName: row.teamName?.trim() || undefined,
          leagueName: row.leagueName?.trim() || undefined,
          metaTitle: row.metaTitle?.trim() || undefined,
          metaDescription: row.metaDescription?.trim() || undefined,
          shippingCost: parseFloat(row.shippingCost ?? "0") || 0,
          variants: {
            create: [{
              sku,
              size: row.size?.trim() || undefined,
              color: row.color?.trim() || undefined,
              price,
              mrp: isNaN(mrp) ? price : mrp,
              costPrice: row.costPrice ? parseFloat(row.costPrice) || undefined : undefined,
              stock: isNaN(stock) ? 0 : stock,
            }],
          },
          images: row.imageUrl?.trim()
            ? { create: [{ url: row.imageUrl.trim(), isPrimary: true, sortOrder: 0 }] }
            : undefined,
        },
      });

      results.push({ row: rowNum, status: "created", name });
      created++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      results.push({ row: rowNum, status: "error", name: row.name, reason: msg });
      errors++;
    }
  }

  return NextResponse.json({ created, skipped, errors, total: rows.length, results }, { status: 200 });
}
