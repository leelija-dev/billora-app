import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for implementing infinite scroll pagination
 * @param {Function} fetchMore - Function to fetch more data
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Distance from bottom in pixels to trigger load (default: 500)
 * @param {boolean} options.hasMore - Whether there are more pages to load
 * @param {boolean} options.loading - Whether data is currently loading
 */
export const useInfiniteScroll = (fetchMore, options = {}) => {
  const {
    threshold = 500,
    hasMore = true,
    loading = false,
  } = options;

  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const fetchMoreRef = useRef(fetchMore);
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(loading);

  // Update refs when props change
  fetchMoreRef.current = fetchMore;
  hasMoreRef.current = hasMore;
  loadingRef.current = loading;

  /**
   * Handle scroll event to detect when user reaches bottom
   */
  const handleScroll = useCallback(({ nativeEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;

    // Calculate distance from bottom
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;

    // Check if we should load more
    if (
      distanceFromBottom < threshold &&
      hasMoreRef.current &&
      !loadingRef.current &&
      !isFetchingMore
    ) {
      setIsFetchingMore(true);
      fetchMoreRef.current().finally(() => {
        setIsFetchingMore(false);
      });
    }
  }, [threshold, isFetchingMore]);

  /**
   * Manually trigger load more
   */
  const loadMore = useCallback(() => {
    if (hasMoreRef.current && !loadingRef.current && !isFetchingMore) {
      setIsFetchingMore(true);
      fetchMoreRef.current().finally(() => {
        setIsFetchingMore(false);
      });
    }
  }, [isFetchingMore]);

  return {
    handleScroll,
    loadMore,
    isFetchingMore,
  };
};

export default useInfiniteScroll;
