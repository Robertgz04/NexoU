import type { RegisterInput, UpdatePersonalDataInput, User } from '../types';
import {
  request,
  storeToken,
  forgetToken,
  restoreToken,
} from '../services/api';
import { getInstallationId } from '../services/deviceRegistration';
interface AuthResult {
  token: string;
  expiresAt: string;
  user: User;
}
async function accept(result: AuthResult) {
  await storeToken(result.token);
  return result.user;
}
export async function register(input: RegisterInput): Promise<User> {
  return accept(
    await request<AuthResult>('/auth/register', {
      method: 'POST',
      body: input,
      public: true,
    }),
  );
}
export async function login(email: string, password: string): Promise<User> {
  return accept(
    await request<AuthResult>('/auth/login', {
      method: 'POST',
      body: { email: email.trim().toLowerCase(), password },
      public: true,
    }),
  );
}
export async function restoreSession(): Promise<User | null> {
  if (!(await restoreToken())) return null;
  return request<User>('/auth/me');
}
export async function clearSession(): Promise<void> {
  await request('/auth/logout', {
    method: 'POST',
    body: { installationId: await getInstallationId() },
  });
  await forgetToken();
}
export async function updatePersonalData(
  _id: string,
  input: UpdatePersonalDataInput,
): Promise<User> {
  return request<User>('/users/me', { method: 'PATCH', body: input });
}
