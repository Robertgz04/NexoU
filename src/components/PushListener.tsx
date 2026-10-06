import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
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
      listenForPush((title, body) => Alert.alert(title, body))
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
