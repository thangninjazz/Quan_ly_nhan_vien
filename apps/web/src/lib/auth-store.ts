'use client';

type AuthData = {
  token: string | null;
  tenantId: string | null;
  user: {
    id: string;
    username: string;
    roles: string[];
  } | null;
};

export const getAuthData = (): AuthData => {
  if (typeof window === 'undefined') return { token: null, tenantId: null, user: null };
  
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenant_id');
  const userStr = localStorage.getItem('user');
  
  let user = null;
  try {
    if (userStr) user = JSON.parse(userStr);
  } catch (e) {}

  return { token, tenantId, user };
};

export const setAuthData = (data: Partial<AuthData>) => {
  if (typeof window === 'undefined') return;

  if (data.token !== undefined) {
    if (data.token) localStorage.setItem('token', data.token);
    else localStorage.removeItem('token');
  }

  if (data.tenantId !== undefined) {
    if (data.tenantId) localStorage.setItem('tenant_id', data.tenantId);
    else localStorage.removeItem('tenant_id');
  }

  if (data.user !== undefined) {
    if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
    else localStorage.removeItem('user');
  }
};

export const clearAuthData = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('tenant_id');
  localStorage.removeItem('user');
};
