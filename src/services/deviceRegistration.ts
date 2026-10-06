import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';
import { Platform } from 'react-native';
import { getJSON, setJSON } from '../data/storage';
import { request } from './api';
const KEY = 'nexou:installation';
let pendingInstallation: Promise<string> | null = null;
export function getInstallationId(): Promise<string> {
  if (!pendingInstallation)
    pendingInstallation = (async () => {
      let id = await getJSON<string | null>(KEY, null);
      if (!id) {
        id = uuid();
        await setJSON(KEY, id);
      }
      return id;
    })().catch(error => {
      pendingInstallation = null;
      throw error;
    });
  return pendingInstallation;
}
export async function linkDevice(token: string) {
  return request(`/devices/${await getInstallationId()}`, {
    method: 'PUT',
    body: { token, plataforma: Platform.OS },
  });
}
export async function unlinkDevice() {
  return request(`/devices/${await getInstallationId()}`, { method: 'DELETE' });
}
