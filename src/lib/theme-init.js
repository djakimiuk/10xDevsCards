(() => {
  // Check if we're in a browser environment
  if (typeof window === "undefined") return;

  let theme = "light";
  const storage = window.localStorage;

  if (storage) {
    const storedTheme = storage.getItem("theme");
    if (storedTheme) {
      theme = storedTheme;
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme = "dark";
    }
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    theme = "dark";
  }

  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
})();
