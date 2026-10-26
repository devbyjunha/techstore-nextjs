import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PushSaveLanding from '../PushSaveLanding';
import { PUSH_SAVE_SAMPLES, downloadPushSaveFile } from '@/lib/braze/push-save';

const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

jest.mock('next/link', () => {
  return function MockLink({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('@/lib/braze/push-save', () => {
  const actual = jest.requireActual('@/lib/braze/push-save') as typeof import('@/lib/braze/push-save');
  return {
    ...actual,
    downloadPushSaveFile: jest.fn(async () => ({ ok: true as const })),
  };
});

describe('PushSaveLanding', () => {
  beforeEach(() => {
    mockSearchParams.forEach((_, key) => mockSearchParams.delete(key));
    (downloadPushSaveFile as jest.Mock).mockResolvedValue({ ok: true });
  });

  it('shows an error when extra keys are missing', () => {
    render(<PushSaveLanding />);
    expect(
      screen.getByText('저장할 이미지를 확인하지 못했습니다')
    ).toBeInTheDocument();
  });

  it('previews the ticket and starts a download for a valid payload', async () => {
    const sample = PUSH_SAVE_SAMPLES[0];
    mockSearchParams.set('action', 'save_image');
    mockSearchParams.set('image_url', sample.imageUrl);
    mockSearchParams.set('file_name', sample.fileName);

    render(<PushSaveLanding />);

    expect(screen.getByAltText(sample.fileName)).toHaveAttribute(
      'src',
      sample.imageUrl
    );
    await waitFor(() => {
      expect(screen.getByText('다운로드를 시작했습니다')).toBeInTheDocument();
    });
  });

  it('retries download from the button', async () => {
    const sample = PUSH_SAVE_SAMPLES[1];
    mockSearchParams.set('image_url', sample.imageUrl);
    mockSearchParams.set('file_name', sample.fileName);

    render(<PushSaveLanding />);
    await waitFor(() => {
      expect(screen.getByText('다운로드를 시작했습니다')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: '다시 다운로드' }));
    expect(downloadPushSaveFile).toHaveBeenCalled();
  });

  it('shows a fallback when auto-download fails', async () => {
    (downloadPushSaveFile as jest.Mock).mockResolvedValue({
      ok: false,
      error: 'http_404',
    });
    const sample = PUSH_SAVE_SAMPLES[0];
    mockSearchParams.set('image_url', sample.imageUrl);
    mockSearchParams.set('file_name', sample.fileName);

    render(<PushSaveLanding />);
    await waitFor(() => {
      expect(screen.getByText(/자동 저장이 막혔습니다/)).toBeInTheDocument();
    });
  });
});
