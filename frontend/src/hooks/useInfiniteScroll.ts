'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { throttle } from '@/src/utils/throttle';

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  enabled: boolean;
  anchorRef?: RefObject<HTMLElement | null>;

  threshold?: number;

  wait?: number;
}

export function useInfiniteScroll({
  onLoadMore,
  enabled,
  anchorRef,
  threshold = 500,
  wait = 300,
}: UseInfiniteScrollOptions) {
  const onLoadMoreRef = useRef(onLoadMore);
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  });

  useEffect(() => {
    if (!enabled) return;

    function checkPosition() {
      const anchor = anchorRef?.current;
      const distanceFromBottom = anchor
        ? anchor.getBoundingClientRect().bottom - window.innerHeight
        : document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      if (distanceFromBottom < threshold) {
        onLoadMoreRef.current();
      }
    }

    const onScroll = throttle(checkPosition, wait);
    window.addEventListener('scroll', onScroll, { passive: true });

    checkPosition();

    return () => {
      window.removeEventListener('scroll', onScroll);
      onScroll.cancel();
    };
  }, [enabled, anchorRef, threshold, wait]);
}
