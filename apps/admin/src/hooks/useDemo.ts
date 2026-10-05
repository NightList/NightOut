import { getVersion, subscribe } from '@nightout/mock';
import { useSyncExternalStore } from 'react';

export function useDemo(): number {
  return useSyncExternalStore(subscribe, getVersion, getVersion);
}
