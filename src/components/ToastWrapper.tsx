'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { ToastContainer } from './Toast';

export default function ToastWrapper() {
  const { state, dispatch } = useStore();

  const handleRemoveToast = (id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  };

  return <ToastContainer toasts={state.toasts} onRemove={handleRemoveToast} />;
}





