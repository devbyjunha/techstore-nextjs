'use client';

import { useEffect, useState } from 'react';
import {
  getIamExperimentLogs,
  subscribeIamExperimentLogs,
  type IamExperimentLogEntry,
} from '@/lib/braze/iam-experiment';

export function useIamExperimentLogs(): IamExperimentLogEntry[] {
  const [logs, setLogs] = useState<IamExperimentLogEntry[]>(() =>
    getIamExperimentLogs()
  );

  useEffect(() => subscribeIamExperimentLogs(setLogs), []);

  return logs;
}
