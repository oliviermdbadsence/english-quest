import { starRow, totalStars } from "../game";
import { colorOf, theme as th } from "../theme";
import type { PendingResult, Profile } from "../types";
import { WORLDS } from "../worlds";
import { Chip, Screen, bigBtn, card, row, smallBtn } from "../ui";

export function ResultScreen({
  profile,
  result,
  onRetry,
  onMap,
  onNext,
  onToggleSound,
}: {
  profile: Profile;
  result: PendingResult;
  onRetry: () => void;
  onMap: () => void;
  onNext: () => void;
  onToggleSound: () => void;
}) {
  const passed = result.stars > 0;
  const stars = totalStars(profile.stars);
  const next = WORLDS[result.worldIndex + 1];
  return (
    <Screen>
      <div data-testid="result-screen">
        <div style={{ ...row, justifyContent: "space-between", marginBottom: 14 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>🚀 English Quest</h1>
          <div style={{ ...row, gap: 8 }}>
            <Chip>
              {profile.avatar} {profile.name}
            </Chip>
            <Chip testId="coins">🪙 {profile.coins}</Chip>
            <Chip testId="star-total">
              ⭐ {stars}/{WORLDS.length * 3}
            </Chip>
            <button type="button" data-testid="sound-toggle" style={smallBtn} onClick={onToggleSound}>
              {profile.sound ? "🔊 Sonido" : "🔇 Sin sonido"}
            </button>
          </div>
        </div>
        <div style={{ ...card, textAlign: "center", padding: 28, border: "3px solid " + colorOf(result.worldIndex) }}>
          <div style={{ fontSize: 56 }}>{passed ? "🏆" : "💪"}</div>
          <div style={{ fontSize: 26, fontWeight: 800, margin: "8px 0" }}>{passed ? "¡Mundo superado!" : "¡Casi lo tienes!"}</div>
          <div data-testid="result-stars" style={{ fontSize: 44, margin: "6px 0" }}>
            {starRow(result.stars)}
          </div>
          <div data-testid="result-score" style={{ fontSize: 20, marginBottom: 6 }}>
            Has acertado {result.score} de {result.total}
          </div>
          <div style={{ fontSize: 18, color: th.text.secondary, marginBottom: 10 }}>🪙 +{result.earned} monedas</div>
          {result.unlocked && next ? (
            <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 10 }}>
              🔓 ¡Nuevo mundo abierto: {next.icon} {next.name}!
            </div>
          ) : null}
          {!passed ? (
            <div style={{ fontSize: 17, color: th.text.secondary, marginBottom: 10 }}>Necesitas 7 aciertos para pasar. ¡Inténtalo otra vez!</div>
          ) : null}
          {passed && result.worldIndex + 1 === WORLDS.length ? (
            <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 10 }}>🎉 ¡Has llegado al último mundo! ¿Puedes conseguir 3 estrellas en todos?</div>
          ) : null}
          <div style={{ ...row, justifyContent: "center", marginTop: 12 }}>
            <button type="button" data-testid="retry" style={bigBtn(!passed)} onClick={onRetry}>
              🔁 Repetir
            </button>
            <button type="button" data-testid="result-map" style={bigBtn(false)} onClick={onMap}>
              🗺️ Mapa
            </button>
            {passed && next ? (
              <button type="button" data-testid="next-world" style={bigBtn(true)} onClick={onNext}>
                ➡️ Siguiente mundo
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </Screen>
  );
}
