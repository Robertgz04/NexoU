import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useToast } from './ToastProvider';
import { useAuth } from '../context/AuthContext';
import { navigationRef } from '../navigation/navigationRef';
import {
  listenForPush,
  onPushRegistrationChange,
} from '../services/pushNotifications';

export default function PushListener() {
  const { user } = useAuth();
  const toast = useToast();
  useEffect(() => {
    if (!user) return;
    let active = true;
    let pendingReport: string | undefined;
    const flush = () => {
      if (active && pendingReport && navigationRef.isReady()) {
        navigationRef.navigate('ReportDetail', { reportId: pendingReport });
        pendingReport = undefined;
      }
    };
    const stopReady = navigationRef.addListener('state', flush);
    const stopNavigationReady = navigationRef.addListener('ready', flush);
    let version = 0;
    let stop = () => {};
    const refresh = () => {
      const current = ++version;
      stop();
      const openReport = (id: string) => {
        pendingReport = id;
        flush();
      };
      listenForPush(
        (title, body, reportId) =>
          toast({
            title,
            message: body,
            kind: 'info',
            action: reportId
              ? { label: 'Ver reporte', onPress: () => openReport(reportId) }
              : undefined,
          }),
        openReport,
      )
        .then(unsubscribe => {
          if (active && current === version) stop = unsubscribe;
          else unsubscribe();
        })
        .catch(() => {});
    };
    refresh();
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    const stopChanges = onPushRegistrationChange(refresh);
    return () => {
      active = false;
      ++version;
      stop();
      stopChanges();
      appState.remove();
      stopReady();
      stopNavigationReady();
    };
  }, [user, toast]);
  return null;
}
