import { describe, it } from '@jest/globals';
import { strict as assert } from 'node:assert';
import { calculatePayroll } from './payroll-engine';

function d(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

describe('calculatePayroll', () => {
  it('applies correct piece rate across effective dates', () => {
    const result = calculatePayroll({
      employees: ['e1'],
      approvedEntries: [
        { employeeId: 'e1', productTypeId: 'p1', quantity: 2, workDate: d('2026-03-10') },
        { employeeId: 'e1', productTypeId: 'p1', quantity: 3, workDate: d('2026-03-20') },
      ],
      pieceRates: [
        { productTypeId: 'p1', effectiveFrom: d('2026-03-01'), rateVnd: 10_000 },
        { productTypeId: 'p1', effectiveFrom: d('2026-03-15'), rateVnd: 12_000 },
      ],
      allowances: [],
    });

    assert.equal(result.missingRates.length, 0);
    assert.equal(result.lines.length, 1);
    assert.equal(result.lines[0].productionPay, 2 * 10_000 + 3 * 12_000);
  });

  it('adds fixed allowances', () => {
    const result = calculatePayroll({
      employees: ['e1'],
      approvedEntries: [],
      pieceRates: [],
      allowances: [
        { employeeId: 'e1', name: 'Chuyên cần', amountVnd: 200_000, effectiveFrom: d('2026-01-01'), effectiveTo: null },
        { employeeId: 'e1', name: 'Xăng xe', amountVnd: 100_000, effectiveFrom: d('2026-01-01'), effectiveTo: null },
      ],
    });

    assert.equal(result.lines[0].allowancePay, 300_000);
    assert.equal(result.lines[0].totalPay, 300_000);
  });

  it('fails with missing rates list', () => {
    const result = calculatePayroll({
      employees: ['e1'],
      approvedEntries: [{ employeeId: 'e1', productTypeId: 'p1', quantity: 1, workDate: d('2026-03-10') }],
      pieceRates: [],
      allowances: [],
    });

    assert.deepEqual(result.missingRates, [{ productTypeId: 'p1', workDate: '2026-03-10' }]);
  });
});

