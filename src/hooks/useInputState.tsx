import { useState } from 'react';

export const useInputState = () => {
  const [isFocused, setIsFocused] = useState(false);

  return {
    isFocused,
    inputProps: {
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
    },
  };
};
