import type { CSSProperties, ReactNode } from "react";
import { theme as th } from "./theme";

export const row: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" };

export const root: CSSProperties = {
  fontFamily: th.font.family,
  color: th.text.primary,
  minHeight: "100dvh",
  padding: "16px 12px calc(28px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
};

export const wrap: CSSProperties = { maxWidth: 760, margin: "0 auto" };

export const card: CSSProperties = {
  background: th.bg.elevated,
  border: "1px solid " + th.border.default,
  borderRadius: 20,
  padding: 18,
  boxSizing: "border-box",
  boxShadow: "0 8px 0 rgba(90, 50, 20, 0.06)",
};

export function bigBtn(primary: boolean, disabled?: boolean): CSSProperties {
  return {
    minHeight: 56,
    padding: "12px 22px",
    fontSize: 20,
    fontWeight: 800,
    fontFamily: th.font.family,
    borderRadius: 16,
    border: "2px solid " + (primary ? th.fill.primary : th.border.strong),
    background: primary ? th.fill.primary : th.bg.elevated,
    color: primary ? th.text.onPrimary : th.text.primary,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.45 : 1,
    boxShadow: disabled ? "none" : "0 4px 0 rgba(90, 50, 20, 0.12)",
    whiteSpace: "normal",
    lineHeight: 1.2,
  };
}

export const smallBtn: CSSProperties = {
  minHeight: 48,
  padding: "8px 14px",
  fontSize: 16,
  fontWeight: 800,
  fontFamily: th.font.family,
  borderRadius: 12,
  border: "1px solid " + th.border.strong,
  background: th.bg.elevated,
  color: th.text.primary,
  cursor: "pointer",
  whiteSpace: "normal",
  lineHeight: 1.2,
};

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div style={root}>
      <div style={wrap}>{children}</div>
    </div>
  );
}

export function Chip({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <div data-testid={testId} style={{ ...smallBtn, cursor: "default" }}>
      {children}
    </div>
  );
}
