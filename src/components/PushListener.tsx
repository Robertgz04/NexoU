import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { navigationRef } from '../navigation/navigationRef';
import {
  listenForPush,
  onPushRegistrationChange,
} from '../services/pushNotifications';

export default function PushListener() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    let active = true;
    let version = 0;
    let stop = () => {};
    const refresh = () => {
      const current = ++version;
      stop();
      const openReport = (id: string) => {
        if (active && navigationRef.isReady())
          navigationRef.navigate('ReportDetail', { reportId: id });
      };
      listenForPush(
        (title, body, reportId) =>
          Alert.alert(
            title,
            body,
            reportId
              ? [
                  { text: 'Cerrar', style: 'cancel' },
                  { text: 'Ver reporte', onPress: () => openReport(reportId) },
                ]
              : undefined,
          ),
        openReport,
      )
        .then(unsubscribe => {
          if (active && current === version) stop = unsubscribe;
          else unsubscribe();
        })
        .catch(() => {});
    };
    refresh();
    const stopChanges = onPushRegistrationChange(refresh);
    return () => {
      active = false;
      ++version;
      stop();
      stopChanges();
    };
  }, [user]);
  return null;
}
