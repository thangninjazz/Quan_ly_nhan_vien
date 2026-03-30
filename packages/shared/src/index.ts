export enum EntryStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum PayrollStatus {
  DRAFT = 'DRAFT',
  CALCULATED = 'CALCULATED',
  LOCKED = 'LOCKED',
}

export interface TenantConfig {
  lat: number;
  lng: number;
  radius: number;
}

export interface PayrollCalculationMetadata {
  entriesCount: number;
  totalQuantity: number;
  allowancesApplied: string[];
}
