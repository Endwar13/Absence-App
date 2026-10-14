import { useState, useCallback } from 'react';

export function useAsync(asyncFunction) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(
    async (...params) => {
      setLoading(true);
      setError(null);
      try {
        const response = await asyncFunction(...params);
        setData(response);
        return response;
      } catch (err) {
        setError(err.message || String(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction]
  );

  return { execute, loading, error, data };
}

export default useAsync;
