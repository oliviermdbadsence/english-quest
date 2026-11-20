/** Fixed bright palette. Same slots the prototype read from useGrokTheme. */
export const theme = {
  font: { family: '"Nunito", "Trebuchet MS", "Segoe UI", sans-serif' },
  text: {
    primary: "#2a2144",
    secondary: "#5c5478",
    tertiary: "#8b84a3",
    onPrimary: "#ffffff",
    success: "#157a3e",
    danger: "#c4233c",
  },
  bg: {
    base: "transparent",
    elevated: "#ffffff",
  },
  border: {
    default: "#f0dcc4",
    strong: "#e4c9a8",
  },
  fill: {
    primary: "#ff7a1a",
    secondary: "#ffe7c7",
    successSubtle: "#e3f8ea",
    dangerSubtle: "#ffe6eb",
  },
  dataviz: {
    categorical: ["#00b3c7", "#ffb000", "#7c5cff", "#22a45a", "#ff6b2c", "#f0a202", "#ff4f9a", "#d4894c"],
    areaAlpha: "33",
  },
};

export function colorOf(i: number): string {
  const colors = theme.dataviz.categorical;
  return colors[i % colors.length];
}
