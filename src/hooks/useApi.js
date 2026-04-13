import { useCallback, useEffect, useRef, useState } from "react";

export const useApi = (apiFunction, dependencies = [], immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction],
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};

export const usePaginatedApi = (apiFunction, dependencies = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const apiFunctionRef = useRef(apiFunction);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    apiFunctionRef.current = apiFunction;

    return () => {
      mountedRef.current = false;
    };
  }, [apiFunction]);

  const loadPage = useCallback(async (pageNum = 1, append = false) => {
    if (typeof apiFunctionRef.current !== "function") {
      console.error("apiFunction must be a function");
      if (mountedRef.current) {
        setError(new Error("apiFunction must be a function"));
      }
      return;
    }

    try {
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }

      console.log("Calling API with page:", pageNum);
      const result = await apiFunctionRef.current({ page: pageNum, limit: 20 });
      console.log("API result:", JSON.stringify(result, null, 2));

      if (!mountedRef.current) return;

      // Log the structure to understand what we're getting
      console.log("Result type:", typeof result);
      console.log("Is array:", Array.isArray(result));
      console.log("Has data property:", result?.data ? "yes" : "no");
      console.log("Has orders property:", result?.orders ? "yes" : "no");

      // Handle different response structures
      let newData = [];
      let totalCount = 0;

      if (result) {
        // Case 1: Direct array
        if (Array.isArray(result)) {
          console.log("Response is direct array");
          newData = result;
          totalCount = result.length;
        }
        // Case 2: { data: [...] }
        else if (result.data && Array.isArray(result.data)) {
          console.log("Response has data array");
          newData = result.data;
          totalCount =
            result.total || result.pagination?.total || result.data.length;
        }
        // Case 3: { orders: [...] }
        else if (result.orders && Array.isArray(result.orders)) {
          console.log("Response has orders array");
          newData = result.orders;
          totalCount =
            result.total || result.pagination?.total || result.orders.length;
        }
        // Case 4: { items: [...] }
        else if (result.items && Array.isArray(result.items)) {
          console.log("Response has items array");
          newData = result.items;
          totalCount =
            result.total || result.pagination?.total || result.items.length;
        }
        // Case 5: Something else - try to find any array property
        else {
          console.log("Looking for array in response");
          const possibleArrays = Object.values(result).find((val) =>
            Array.isArray(val),
          );
          if (possibleArrays) {
            newData = possibleArrays;
            totalCount = possibleArrays.length;
            console.log("Found array with length:", possibleArrays.length);
          } else {
            console.log("No array found in response");
          }
        }
      }

      console.log("Extracted data length:", newData.length);
      console.log("Total count:", totalCount);

      if (mountedRef.current) {
        if (append) {
          setData((prev) => [...prev, ...newData]);
        } else {
          setData(newData);
        }

        setTotal(totalCount);
        setHasMore(newData.length >= 20);
        setPage(pageNum);
      }

      return result;
    } catch (err) {
      console.error("API error:", err);
      if (mountedRef.current) {
        setError(err);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadPage(page + 1, true);
    }
  }, [loading, hasMore, page, loadPage]);

  const refresh = useCallback(async () => {
    if (mountedRef.current) {
      setRefreshing(true);
    }
    return loadPage(1, false);
  }, [loadPage]);

  useEffect(() => {
    loadPage(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies]);

  const reset = useCallback(() => {
    if (mountedRef.current) {
      setData([]);
      setPage(1);
      setHasMore(true);
      setTotal(0);
      setError(null);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    refreshing,
    page,
    hasMore,
    total,
    loadPage,
    loadMore,
    refresh,
    reset,
  };
};

export const useMutation = (apiFunction) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunction(...args);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction],
  );

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    mutate,
    reset,
  };
};
