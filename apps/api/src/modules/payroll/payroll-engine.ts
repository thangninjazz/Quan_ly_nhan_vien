type EmployeeId = string;
type ProductTypeId = string;

export type ApprovedEntry = {
  employeeId: EmployeeId;
  productTypeId: ProductTypeId;
  quantity: number;
  workDate: Date;
};

export type PieceRate = {
  productTypeId: ProductTypeId;
  effectiveFrom: Date;
  rateVnd: number;
};

export type Allowance = {
  employeeId: EmployeeId;
  name: string;
  amountVnd: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

export type MissingRate = {
  productTypeId: ProductTypeId;
  workDate: string;
};

export type PayrollLineItemResult = {
  productTypeId: ProductTypeId;
  quantityTotal: number;
  rateEffectiveFrom: Date;
  rateVnd: number;
  amountVnd: number;
};

export type PayrollLineResult = {
  employeeId: EmployeeId;
  productionPay: number;
  allowancePay: number;
  totalPay: number;
  allowancesApplied: string[];
  items: PayrollLineItemResult[];
};

export function calculatePayroll(input: {
  employees: EmployeeId[];
  approvedEntries: ApprovedEntry[];
  pieceRates: PieceRate[];
  allowances: Allowance[];
}): { missingRates: MissingRate[]; lines: PayrollLineResult[] } {
  const missingRates: MissingRate[] = [];

  const rateByProduct = new Map<ProductTypeId, PieceRate[]>();
  for (const rate of input.pieceRates) {
    const list = rateByProduct.get(rate.productTypeId) ?? [];
    list.push(rate);
    rateByProduct.set(rate.productTypeId, list);
  }
  for (const [productTypeId, list] of rateByProduct.entries()) {
    list.sort((a, b) => a.effectiveFrom.getTime() - b.effectiveFrom.getTime());
    rateByProduct.set(productTypeId, list);
  }

  function resolveRate(productTypeId: string, workDate: Date): PieceRate | null {
    const list = rateByProduct.get(productTypeId);
    if (!list || list.length === 0) return null;

    // last rate where effectiveFrom <= workDate
    let lo = 0;
    let hi = list.length - 1;
    let bestIndex = -1;
    const t = workDate.getTime();
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (list[mid].effectiveFrom.getTime() <= t) {
        bestIndex = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return bestIndex >= 0 ? list[bestIndex] : null;
  }

  const allowanceSumByEmployee = new Map<EmployeeId, number>();
  const allowanceNamesByEmployee = new Map<EmployeeId, string[]>();
  for (const a of input.allowances) {
    allowanceSumByEmployee.set(a.employeeId, (allowanceSumByEmployee.get(a.employeeId) ?? 0) + a.amountVnd);
    allowanceNamesByEmployee.set(a.employeeId, [...(allowanceNamesByEmployee.get(a.employeeId) ?? []), a.name]);
  }

  // group items by employee + productType + rateEffectiveFrom + rateVnd
  const itemGroups = new Map<string, { employeeId: string; productTypeId: string; rateEffectiveFrom: Date; rateVnd: number; quantityTotal: number }>();
  for (const entry of input.approvedEntries) {
    if (entry.quantity < 0) continue;
    const rate = resolveRate(entry.productTypeId, entry.workDate);
    if (!rate) {
      missingRates.push({
        productTypeId: entry.productTypeId,
        workDate: entry.workDate.toISOString().slice(0, 10),
      });
      continue;
    }
    const key = `${entry.employeeId}|${entry.productTypeId}|${rate.effectiveFrom.toISOString().slice(0, 10)}|${rate.rateVnd}`;
    const existing = itemGroups.get(key);
    if (!existing) {
      itemGroups.set(key, {
        employeeId: entry.employeeId,
        productTypeId: entry.productTypeId,
        rateEffectiveFrom: rate.effectiveFrom,
        rateVnd: rate.rateVnd,
        quantityTotal: entry.quantity,
      });
    } else {
      existing.quantityTotal += entry.quantity;
    }
  }

  const itemsByEmployee = new Map<EmployeeId, PayrollLineItemResult[]>();
  for (const g of itemGroups.values()) {
    const amountVnd = g.quantityTotal * g.rateVnd;
    const items = itemsByEmployee.get(g.employeeId) ?? [];
    items.push({
      productTypeId: g.productTypeId,
      quantityTotal: g.quantityTotal,
      rateEffectiveFrom: g.rateEffectiveFrom,
      rateVnd: g.rateVnd,
      amountVnd,
    });
    itemsByEmployee.set(g.employeeId, items);
  }

  const lines: PayrollLineResult[] = [];
  for (const employeeId of input.employees) {
    const items = (itemsByEmployee.get(employeeId) ?? []).sort(
      (a, b) =>
        a.productTypeId.localeCompare(b.productTypeId) ||
        a.rateEffectiveFrom.getTime() - b.rateEffectiveFrom.getTime(),
    );
    const productionPay = items.reduce((acc, it) => acc + it.amountVnd, 0);
    const allowancePay = allowanceSumByEmployee.get(employeeId) ?? 0;
    const allowancesApplied = allowanceNamesByEmployee.get(employeeId) ?? [];
    lines.push({
      employeeId,
      productionPay,
      allowancePay,
      totalPay: productionPay + allowancePay,
      allowancesApplied,
      items,
    });
  }

  // de-dup missing rates
  const missingKey = new Set<string>();
  const dedupedMissing: MissingRate[] = [];
  for (const m of missingRates) {
    const k = `${m.productTypeId}|${m.workDate}`;
    if (missingKey.has(k)) continue;
    missingKey.add(k);
    dedupedMissing.push(m);
  }

  return { missingRates: dedupedMissing, lines };
}

