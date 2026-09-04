'use client';

import { useState, useCallback } from 'react';

export type MascotState = 'idle' | 'walking' | 'expanding' | 'chat';

export function useMascotState() {
  const [state, setState] = useState<MascotState>('idle');
  const [isWalking, setIsWalking] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [isLooking, setIsLooking] = useState(false);

  const dispatch = useCallback((newState: MascotState) => {
    setState(newState);

    switch (newState) {
      case 'idle':
        setIsWalking(false);
        setIsOpen(false);
        setIsLooking(true);
        break;
      case 'walking':
        setIsWalking(true);
        setIsOpen(false);
        setIsLooking(false);
        break;
      case 'expanding':
        setIsWalking(false);
        setIsOpen(true);
        setIsLooking(true);
        break;
      case 'chat':
        setIsWalking(false);
        setIsOpen(true);
        setIsLooking(true);
        break;
    }
  }, []);

  const toggleChat = useCallback(() => {
    if (!isOpen) {
      dispatch('expanding');
    } else {
      dispatch('idle');
    }
  }, [isOpen, dispatch]);

  const startWalking = useCallback(() => {
    dispatch('walking');
  }, [dispatch]);

  const finishEntering = useCallback(() => {
    setIsEntering(false);
  }, []);

  return {
    state,
    isWalking,
    isOpen,
    isEntering,
    isLooking,
    dispatch,
    toggleChat,
    startWalking,
    finishEntering,
  };
}
