import * as React from 'react';
import { ApiQuery } from '../types/extraTypes';

import { useFetch } from './useFetch';

const TIMEOUT = 10000;

export const useFetchPeriodically = <R>(
  query: ApiQuery,
  onFetchComplete?: (data: R) => void,
): [R | undefined, boolean, unknown, VoidFunction, boolean] => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [data, setData] = React.useState<R>();
  const [error, setError] = React.useState<unknown>();
  const [forceUpdate, setForceUpdate] = React.useState(0);
  const ref = React.useRef(0);
  const prevResolvedQueryHash = React.useRef<string>();
  const isMountedRef = React.useRef(true);

  const { get } = useFetch();

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    let abortController: AbortController;

    const fetchPeriodically = async (id: number) => {
      while (ref.current === id) {
        const requestQuery = query.endpoint;
        if (requestQuery) {
          try {
            abortController = new AbortController();
            if (id > 0 && prevResolvedQueryHash.current !== query.endpoint) {
              if (isMountedRef.current) {
              setIsUpdating(true);
              }
            }

            const data = (await get<R>(requestQuery, abortController.signal)) as R;
            
            // Check if component is still mounted before updating state
            if (!isMountedRef.current) {
              return;
            }
            
            if (isLoading) {
              setIsLoading(false);
            }
            setIsUpdating(false);

            if (onFetchComplete) {
              onFetchComplete(data); // Data might be mutated at this point
              setData(data);
            } else {
              setData(data);
            }
            setError(undefined);
          } catch (err) {
            // aborting fetch trows 'AbortError', we can ignore it
            if (abortController.signal.aborted) {
              return;
            }
            
            // Check if component is still mounted before updating state
            if (!isMountedRef.current) {
              return;
            }
            
            setError(err);
            setIsLoading(false);
            setIsUpdating(false);
          }
        } else {
          if (isMountedRef.current) {
          setIsLoading(false);
          setError(undefined);
          setData(undefined);
          }
        }
        prevResolvedQueryHash.current = query.endpoint;
        await new Promise((resolve) => setTimeout(resolve, query.timeout || TIMEOUT));
      }
    };

    fetchPeriodically(ref.current);
    return () => {
      // eslint-disable-next-line
      ref.current++;
      abortController?.abort();
    };
    // eslint-disable-next-line
  }, [get, forceUpdate, query.endpoint]);

  const refetch = React.useCallback(() => setForceUpdate((val) => val + 1), []);

  return [data, isLoading, error, refetch, isUpdating];
};
