// On page load or when changing themes, best to add inline in `head` to avoid FOUC
export function initTheme() {
  document.documentElement.classList.toggle(
    "dark",
    localStorage.theme === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
}

// Whenever the user explicitly chooses light mode
export function setLightMode() {
  localStorage.theme = "light";
  document.documentElement.classList.remove("dark");
}

// Whenever the user explicitly chooses dark mode
export function setDarkMode() {
  localStorage.theme = "dark";
  document.documentElement.classList.add("dark");
}

// Whenever the user explicitly chooses to respect the OS preference
export function setSystemMode() {
  localStorage.removeItem("theme");
  initTheme();
}
