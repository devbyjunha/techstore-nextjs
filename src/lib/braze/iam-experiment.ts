'use client';

/**
 * Web SDK IAM Pseudo Control Group.
 *
 * Braze 기본 Control Group 대신 일반 Variant Extra(`experiment_group=cg`)를
 * 대조군으로 쓰고, impression만 기록한 뒤 UI는 표시하지 않습니다.
 *
 * Web SDK에는 `message.logImpression()`이 없으므로
 * `braze.logInAppMessageImpression(message)`를 사용합니다.
 */

export const IAM_EXPERIMENT_GROUP_KEY = 'experiment_group';
export const IAM_CONTROL_GROUP_VALUE = 'cg';
export const IAM_EXPERIMENT_TEST_EVENT = 'iam_experiment_test';

export type IamExperimentGroup = 'cg' | 'tg_a' | 'tg_b' | string;

export type IamExperimentAction = 'hide_and_log_impression' | 'show';

export interface IamLikeMessage {
  extras?: Record<string, string>;
  message?: string;
}

export interface IamExperimentBraze {
  subscribeToInAppMessage: (
    callback: (message: IamLikeMessage) => void
  ) => string | undefined;
  showInAppMessage: (message: IamLikeMessage) => boolean | undefined;
  logInAppMessageImpression: (message: IamLikeMessage) => boolean;
}

export interface IamExperimentDecision {
  experimentGroup?: string;
  action: IamExperimentAction;
  uiShown: boolean;
  impressionManual: boolean;
}

export interface IamExperimentLogEntry extends IamExperimentDecision {
  at: string;
  source: 'sdk' | 'simulation';
  impressionLogged: boolean;
  messagePreview?: string;
}

export interface IamExperimentHandleResult extends IamExperimentDecision {
  impressionLogged: boolean;
}

export function getIamExperimentGroup(
  extras?: Record<string, string>
): string | undefined {
  const value = extras?.[IAM_EXPERIMENT_GROUP_KEY];
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function resolveIamExperimentDecision(
  extras?: Record<string, string>
): IamExperimentDecision {
  const experimentGroup = getIamExperimentGroup(extras);

  if (experimentGroup === IAM_CONTROL_GROUP_VALUE) {
    return {
      experimentGroup,
      action: 'hide_and_log_impression',
      uiShown: false,
      impressionManual: true,
    };
  }

  return {
    experimentGroup,
    action: 'show',
    uiShown: true,
    impressionManual: false,
  };
}

const MAX_LOG_ENTRIES = 40;
const logEntries: IamExperimentLogEntry[] = [];
const logListeners = new Set<(entries: IamExperimentLogEntry[]) => void>();

function emitLog(entry: IamExperimentLogEntry): void {
  logEntries.unshift(entry);
  if (logEntries.length > MAX_LOG_ENTRIES) {
    logEntries.length = MAX_LOG_ENTRIES;
  }

  const snapshot = [...logEntries];
  logListeners.forEach((listener) => listener(snapshot));
}

export function getIamExperimentLogs(): IamExperimentLogEntry[] {
  return [...logEntries];
}

export function subscribeIamExperimentLogs(
  listener: (entries: IamExperimentLogEntry[]) => void
): () => void {
  logListeners.add(listener);
  listener([...logEntries]);
  return () => {
    logListeners.delete(listener);
  };
}

export function clearIamExperimentLogs(): void {
  logEntries.length = 0;
  logListeners.forEach((listener) => listener([]));
}

export function recordIamExperimentLog(
  entry: Omit<IamExperimentLogEntry, 'at'> & { at?: string }
): IamExperimentLogEntry {
  const full: IamExperimentLogEntry = {
    ...entry,
    at: entry.at ?? new Date().toISOString(),
  };
  emitLog(full);
  return full;
}

export class IamExperimentWrapper {
  private readonly loggedControlMessages = new WeakSet<object>();
  private installed = false;

  constructor(private readonly braze: IamExperimentBraze) {}

  install(): void {
    if (this.installed) {
      return;
    }

    this.braze.subscribeToInAppMessage((message) => {
      this.handle(message, 'sdk');
    });
    this.installed = true;
  }

  isInstalled(): boolean {
    return this.installed;
  }

  handle(
    message: IamLikeMessage,
    source: IamExperimentLogEntry['source'] = 'sdk'
  ): IamExperimentHandleResult {
    const decision = resolveIamExperimentDecision(message.extras);

    if (decision.action === 'hide_and_log_impression') {
      let impressionLogged = false;

      if (!this.loggedControlMessages.has(message)) {
        this.loggedControlMessages.add(message);
        impressionLogged = Boolean(this.braze.logInAppMessageImpression(message));
      }

      const result = { ...decision, impressionLogged };
      recordIamExperimentLog({
        ...result,
        source,
        messagePreview: message.message,
      });
      return result;
    }

    const uiShown = Boolean(this.braze.showInAppMessage(message));
    const result = { ...decision, uiShown, impressionLogged: false };
    recordIamExperimentLog({
      ...result,
      source,
      messagePreview: message.message,
    });
    return result;
  }
}

let wrapperInstance: IamExperimentWrapper | null = null;

export function installIamExperimentWrapper(
  braze: IamExperimentBraze
): IamExperimentWrapper {
  if (!wrapperInstance) {
    wrapperInstance = new IamExperimentWrapper(braze);
  }

  wrapperInstance.install();
  return wrapperInstance;
}

export function getIamExperimentWrapper(): IamExperimentWrapper | null {
  return wrapperInstance;
}

export function resetIamExperimentWrapperForTests(): void {
  wrapperInstance = null;
  clearIamExperimentLogs();
}
