import * as React from 'react';
import { useAppContext } from './useAppContext';

const isDisabledBuilderService = (error: Error): boolean =>
  Number(error.message) === 501 || Number(error.message) === 500;

export const useBuilderEnabled = (shouldCheck: boolean = true): boolean => {
  const { fetch } = useAppContext();
  const proxyFetch = fetch.proxyFetch;
  const [builderEnabled, setBuilderEnabled] = React.useState(false);

  React.useEffect(() => {
    if (!shouldCheck) {
      return;
    }

    let abortController: AbortController;

    const checkBuilderServiceEnabled = async () => {
      try {
        abortController = new AbortController();
        const response = await proxyFetch('builder-enabled', {
          method: 'GET',
          headers: { Accept: 'application/json' },
          credentials: 'include',
          signal: abortController.signal,
        });
        setBuilderEnabled(response.status !== 501);
      } catch (err) {
        if (!abortController?.signal.aborted) {
          if (isDisabledBuilderService(err as Error)) {
            setBuilderEnabled(false);
          } else {
            // For other errors, assume builder is enabled but there's a temporary issue
            setBuilderEnabled(true);
          }
        }
      }
    };

    void checkBuilderServiceEnabled();

    return () => {
      abortController?.abort();
    };
  }, [proxyFetch, shouldCheck]);

  return builderEnabled;
};

