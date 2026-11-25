import { starRow, totalStars } from "../game";
import { MATHS_WORLDS } from "../maths/problems";
import { colorOf, theme as th } from "../theme";
import type { MathsResult, Profile } from "../types";
import { Chip, Screen, bigBtn, card, row } from "../ui";

export function MathsResultScreen({
  profile,
  result,
  onRetry,
  onMap,
  onNext,
}: {
  profile: Profile;
  result: MathsResult;
  onRetry: () => void;
  onMap: () => void;
  onNext: () => void;
}) {
  const passed = result.stars > 0;
  const next = MATHS_WORLDS[result.worldIndex + 1];
  return (
    <Screen>
      <div data-testid="maths-result">
        <div style={{ ...row, justifyContent: "space-between", marginBottom: 14 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>🧮 Missió Problemes</h1>
          <Chip>
            {profile.avatar} {profile.name}
          </Chip>
        </div>
        <div style={{ ...card, textAlign: "center", padding: 28, border: "3px solid " + colorOf(result.worldIndex) }}>
          <div style={{ fontSize: 56 }}>{passed ? "🏆" : "💪"}</div>
          <div style={{ fontSize: 26, fontWeight: 800, margin: "8px 0" }}>{passed ? "Món superat!" : "Gairebé!"}</div>
          <div data-testid="maths-result-stars" style={{ fontSize: 40 }}>{starRow(result.stars)}</div>
          <div data-testid="maths-result-score" style={{ fontSize: 20, margin: "8px 0" }}>
            Has entès {result.score} de {result.total} problemes a la primera
          </div>
          <div style={{ fontSize: 18, color: th.text.secondary, marginBottom: 10 }}>🪙 +{result.earned} monedes</div>
          {result.unlocked && next ? <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 10 }}>Nou món obert: {next.icon} {next.name}</div> : null}
          {!passed ? <p style={{ fontSize: 17, color: th.text.secondary, marginBottom: 10 }}>Et calen 5 de 6 problemes bé a la primera per obrir el següent món.</p> : null}
          <div style={{ ...row, justifyContent: "center" }}>
            <button type="button" data-testid="maths-retry" style={bigBtn(!passed)} onClick={onRetry}>
              🔁 Repetir
            </button>
            <button type="button" data-testid="maths-result-map" style={bigBtn(false)} onClick={onMap}>
              🗺️ Mapa
            </button>
            {passed && next ? (
              <button type="button" style={bigBtn(true)} onClick={onNext}>
                ➡️ Següent món
              </button>
            ) : null}
          </div>
          <p style={{ marginTop: 14, fontSize: 15, color: th.text.secondary }}>Estrelles de problemes: {totalStars(profile.maths.stars)}</p>
        </div>
      </div>
    </Screen>
  );
}
