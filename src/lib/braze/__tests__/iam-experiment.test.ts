import {
  IamExperimentWrapper,
  IAM_CONTROL_GROUP_VALUE,
  IAM_EXPERIMENT_GROUP_KEY,
  clearIamExperimentLogs,
  getIamExperimentLogs,
  getIamExperimentWrapper,
  installIamExperimentWrapper,
  resetIamExperimentWrapperForTests,
  resolveIamExperimentDecision,
  type IamExperimentBraze,
  type IamLikeMessage,
} from '../iam-experiment';

function createBrazeMock(): IamExperimentBraze & {
  subscriber?: (message: IamLikeMessage) => void;
} {
  const api: IamExperimentBraze & {
    subscriber?: (message: IamLikeMessage) => void;
  } = {
    subscribeToInAppMessage: jest.fn((callback) => {
      api.subscriber = callback;
      return 'sub-1';
    }),
    showInAppMessage: jest.fn(() => true),
    logInAppMessageImpression: jest.fn(() => true),
  };
  return api;
}

function createMessage(
  extras?: Record<string, string>,
  body = 'IAM body'
): IamLikeMessage {
  return { extras, message: body };
}

describe('resolveIamExperimentDecision', () => {
  it('hides UI and logs impression for the control variant', () => {
    expect(
      resolveIamExperimentDecision({ [IAM_EXPERIMENT_GROUP_KEY]: IAM_CONTROL_GROUP_VALUE })
    ).toEqual({
      experimentGroup: 'cg',
      action: 'hide_and_log_impression',
      uiShown: false,
      impressionManual: true,
    });
  });

  it('shows treatment variants without a manual impression', () => {
    expect(
      resolveIamExperimentDecision({ [IAM_EXPERIMENT_GROUP_KEY]: 'tg_a' })
    ).toEqual({
      experimentGroup: 'tg_a',
      action: 'show',
      uiShown: true,
      impressionManual: false,
    });
    expect(
      resolveIamExperimentDecision({ [IAM_EXPERIMENT_GROUP_KEY]: 'tg_b' })
    ).toMatchObject({ action: 'show', experimentGroup: 'tg_b' });
  });

  it('shows IAM when experiment_group is missing or blank', () => {
    expect(resolveIamExperimentDecision(undefined)).toMatchObject({
      action: 'show',
      experimentGroup: undefined,
    });
    expect(
      resolveIamExperimentDecision({ [IAM_EXPERIMENT_GROUP_KEY]: '  ' })
    ).toMatchObject({ action: 'show', experimentGroup: undefined });
  });
});

describe('IamExperimentWrapper', () => {
  afterEach(() => {
    resetIamExperimentWrapperForTests();
  });

  it('installs a subscribeToInAppMessage handler once', () => {
    const braze = createBrazeMock();
    const wrapper = new IamExperimentWrapper(braze);

    wrapper.install();
    wrapper.install();

    expect(braze.subscribeToInAppMessage).toHaveBeenCalledTimes(1);
    expect(wrapper.isInstalled()).toBe(true);
  });

  it('logs impression and skips UI for cg', () => {
    const braze = createBrazeMock();
    const wrapper = new IamExperimentWrapper(braze);
    const message = createMessage({ experiment_group: 'cg' }, 'control copy');

    const result = wrapper.handle(message, 'simulation');

    expect(result).toMatchObject({
      action: 'hide_and_log_impression',
      uiShown: false,
      impressionLogged: true,
    });
    expect(braze.logInAppMessageImpression).toHaveBeenCalledWith(message);
    expect(braze.showInAppMessage).not.toHaveBeenCalled();
    expect(getIamExperimentLogs()[0]).toMatchObject({
      source: 'simulation',
      experimentGroup: 'cg',
      impressionLogged: true,
      messagePreview: 'control copy',
    });
  });

  it('does not log the same control message twice', () => {
    const braze = createBrazeMock();
    const wrapper = new IamExperimentWrapper(braze);
    const message = createMessage({ experiment_group: 'cg' });

    expect(wrapper.handle(message).impressionLogged).toBe(true);
    expect(wrapper.handle(message).impressionLogged).toBe(false);
    expect(braze.logInAppMessageImpression).toHaveBeenCalledTimes(1);
  });

  it('shows treatment IAM without a manual impression', () => {
    const braze = createBrazeMock();
    const wrapper = new IamExperimentWrapper(braze);
    const message = createMessage({ experiment_group: 'tg_a' });

    const result = wrapper.handle(message);

    expect(result).toMatchObject({
      action: 'show',
      uiShown: true,
      impressionLogged: false,
      impressionManual: false,
    });
    expect(braze.showInAppMessage).toHaveBeenCalledWith(message);
    expect(braze.logInAppMessageImpression).not.toHaveBeenCalled();
  });

  it('shows IAM when extras are absent', () => {
    const braze = createBrazeMock();
    const wrapper = new IamExperimentWrapper(braze);
    const message = createMessage();

    wrapper.handle(message);

    expect(braze.showInAppMessage).toHaveBeenCalledWith(message);
    expect(braze.logInAppMessageImpression).not.toHaveBeenCalled();
  });

  it('routes subscribed IAM through the same handler', () => {
    const braze = createBrazeMock();
    const wrapper = installIamExperimentWrapper(braze);

    expect(getIamExperimentWrapper()).toBe(wrapper);
    expect(braze.subscriber).toBeDefined();

    braze.subscriber?.(createMessage({ experiment_group: 'cg' }));

    expect(braze.logInAppMessageImpression).toHaveBeenCalledTimes(1);
    expect(getIamExperimentLogs()[0].source).toBe('sdk');
  });

  it('reuses a singleton wrapper on repeated install', () => {
    const braze = createBrazeMock();
    const first = installIamExperimentWrapper(braze);
    const second = installIamExperimentWrapper(braze);

    expect(first).toBe(second);
    expect(braze.subscribeToInAppMessage).toHaveBeenCalledTimes(1);
  });

  it('clears recorded logs', () => {
    const braze = createBrazeMock();
    new IamExperimentWrapper(braze).handle(
      createMessage({ experiment_group: 'tg_b' }),
      'simulation'
    );

    expect(getIamExperimentLogs()).toHaveLength(1);
    clearIamExperimentLogs();
    expect(getIamExperimentLogs()).toHaveLength(0);
  });
});
