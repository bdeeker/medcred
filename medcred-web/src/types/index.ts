export interface User {
  email: string;
  role: string;
  orgId: string;
  token: string;
}

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  licenseNumber: string;
  isActive: boolean;
  credentialCount: number;
  expiringCount: number;
  expiredCount: number;
}

export interface Credential {
  id: string;
  status: 'Active' | 'Expiring' | 'Expired';
  issuedDate: string;
  expiryDate: string;
  fileUrl?: string;
  staffMember: string;
  staffMemberId: string;
  credentialType: string;
  credentialTypeId: string;
  daysUntilExpiry: number;
}

export interface CredentialType {
  id: string;
  name: string;
  warnDaysAhead: number;
  isRequired: boolean;
}

export interface DashboardData {
  summary: { status: string; count: number }[];
  expiringSoon: {
    id: string;
    staffMember: string;
    credentialType: string;
    expiryDate: string;
    daysUntilExpiry: number;
  }[];
}
