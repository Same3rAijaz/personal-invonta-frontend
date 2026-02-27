import React from "react";

export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
