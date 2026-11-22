import { useEffect, useLayoutEffect } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { readTheme, selectTheme, themeLoaded, themeToggled } from "../../../store/publicSlice.js";

export function ThemeProvider({ children }) {
  const dispatch = useDispatch();
  const store = useStore();
  const theme = useSelector(selectTheme);

  useLayoutEffect(() => {
    dispatch(themeLoaded(readTheme()));
  }, [dispatch]);

  useEffect(() => {
    // Hydration may have selected a different saved theme before this effect runs.
    if (selectTheme(store.getState()) !== theme) return;
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("careernest-theme", theme);
  }, [store, theme]);

  return children;
}

export function useTheme() {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);
  return { theme, toggleTheme: () => dispatch(themeToggled()), isDark: theme === "dark" };
}
