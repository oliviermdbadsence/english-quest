import { totalStars } from "../game";
import { MATHS_WORLDS } from "../maths/problems";
import { theme as th } from "../theme";
import type { Profile } from "../types";
import { WORLDS } from "../worlds";
import { Chip, Screen, bigBtn, card } from "../ui";

export function GamePicker({ profile, onEnglish, onMaths, onSwitch }: { profile: Profile; onEnglish: () => void; onMaths: () => void; onSwitch: () => void }) {
  const englishNote = profile.round ? "⏸️ Partida a medias" : profile.pendingResult ? "🏆 Partida terminada" : "Mapa de mundos";
  const mathsNote = profile.maths.round ? "⏸️ Missió a mitges" : profile.maths.pendingResult ? "🏆 Missió acabada" : "Entén el problema";
  return (
    <Screen>
      <div data-testid="game-picker">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>A què jugues?</h1>
          <Chip>
            {profile.avatar} {profile.name}
          </Chip>
        </div>
        <p style={{ fontSize: 18, color: th.text.secondary, lineHeight: 1.45, marginBottom: 16 }}>
          El mateix jugador, dos jocs. L'anglès i els problemes es guarden per separat.
        </p>
        <div style={{ display: "grid", gap: 14 }}>
          <button
            type="button"
            data-testid="pick-english"
            onClick={onEnglish}
            style={{ ...card, textAlign: "left", cursor: "pointer", fontFamily: th.font.family, color: th.text.primary, minHeight: 120, border: "3px solid #00b3c7" }}
          >
            <div style={{ fontSize: 40 }}>🚀</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>English Quest</div>
            <div style={{ fontSize: 16, color: th.text.secondary, marginTop: 4 }}>
              ⭐ {totalStars(profile.stars)}/{WORLDS.length * 3} · 🪙 {profile.coins}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 6 }}>{englishNote}</div>
          </button>
          <button
            type="button"
            data-testid="pick-maths"
            onClick={onMaths}
            style={{ ...card, textAlign: "left", cursor: "pointer", fontFamily: th.font.family, color: th.text.primary, minHeight: 120, border: "3px solid #ff7a1a" }}
          >
            <div style={{ fontSize: 40 }}>🧮</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>Missió Problemes</div>
            <div style={{ fontSize: 16, color: th.text.secondary, marginTop: 4 }}>Entén què demana el problema abans de calcular.</div>
            <div style={{ fontSize: 16, color: th.text.secondary }}>
              ⭐ {totalStars(profile.maths.stars)}/{MATHS_WORLDS.length * 3} · 🪙 {profile.maths.coins}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 6 }}>{mathsNote}</div>
          </button>
        </div>
        <button type="button" data-testid="switch-player" style={{ ...bigBtn(false), marginTop: 16 }} onClick={onSwitch}>
          Canviar jugador
        </button>
      </div>
    </Screen>
  );
}
