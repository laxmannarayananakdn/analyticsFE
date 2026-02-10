import React, { createContext, useContext, useMemo, useState } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme, ThemeId } from './themes';

interface ThemeContextValue {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useThemeSwitch() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeSwitch must be used within ThemeProvider');
  }
  return ctx;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeId, setThemeId] = useState<ThemeId>('dark');
  const theme = useMemo(() => createAppTheme(themeId), [themeId]);
  const value = useMemo(
    () => ({ themeId, setThemeId }),
    [themeId]
  );

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
