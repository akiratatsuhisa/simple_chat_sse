import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

export function useCachedState<S>(
  key: string,
  initialState?: S | (() => S)
): [S, Dispatch<SetStateAction<S>>] {
  const previousKeyRef = useRef<string>(key);

  useEffect(() => {
    previousKeyRef.current = key;
  }, [key]);

  const [state, setState] = useState<S>(() => {
    const cachedState = history.state?.[key];

    if (cachedState) {
      return cachedState;
    }

    if (typeof initialState === "function") {
      return (initialState as () => S)();
    }

    return initialState;
  });

  useEffect(() => {
    const previousKey = previousKeyRef.current;
    const currentKey = key;

    const previousHistoryState: Record<string, unknown> =
      typeof history.state !== "object" ? {} : history.state;

    const currentHistoryState: Record<string, unknown> = {
      ...previousHistoryState,
      [currentKey]: state,
    };

    if (previousKey != currentKey) {
      delete currentHistoryState.previousCacheKey;
    }

    history.replaceState(currentHistoryState, "", window.location.href);
  }, [key, state]);

  return [state, setState];
}
