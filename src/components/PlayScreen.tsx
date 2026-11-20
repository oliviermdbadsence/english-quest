import { answerSpeech, answerText, builtText, promptSpeech } from "../game";
import { colorOf, theme as th } from "../theme";
import type { Profile, Tile } from "../types";
import { WORLDS } from "../worlds";
import { Chip, Screen, bigBtn, card, row, smallBtn } from "../ui";

export function PlayScreen({
  profile,
  onMap,
  onToggleSound,
  onPick,
  onPushTile,
  onRemoveBuilt,
  onClear,
  onCheck,
  onNext,
  onSpeak,
}: {
  profile: Profile;
  onMap: () => void;
  onToggleSound: () => void;
  onPick: (option: string) => void;
  onPushTile: (id: number) => void;
  onRemoveBuilt: (index: number) => void;
  onClear: () => void;
  onCheck: () => void;
  onNext: () => void;
  onSpeak: (text: string) => void;
}) {
  const saved = profile.round;
  if (!saved) return null;
  const world = WORLDS[saved.worldIndex];
  const item = saved.round[saved.idx];
  if (!world || !item) return null;
  const q = item.q;
  const correctText = answerText(q);
  const preSpeak = promptSpeech(q);
  const builtVals = saved.built.map((id) => item.tiles.find((tile) => tile.id === id)?.v ?? "");
  const full = item.tiles.length > 0 && saved.built.length === item.tiles.length;
  const col = colorOf(saved.worldIndex);

  const optStyle = (option: string) => {
    let bg = th.bg.elevated;
    let bd = th.border.strong;
    if (saved.checked && q.k === "c") {
      if (option === q.a) {
        bg = th.fill.successSubtle;
        bd = th.text.success;
      } else if (option === saved.picked) {
        bg = th.fill.dangerSubtle;
        bd = th.text.danger;
      }
    }
    return {
      minHeight: 64,
      padding: "12px 14px",
      fontSize: 21,
      fontWeight: 800,
      fontFamily: th.font.family,
      borderRadius: 16,
      border: "3px solid " + bd,
      background: bg,
      color: th.text.primary,
      cursor: saved.checked ? "default" : "pointer",
      whiteSpace: "normal" as const,
      lineHeight: 1.25,
      width: "100%",
    };
  };

  const tileStyle = (used: boolean) => ({
    minWidth: 52,
    minHeight: 52,
    padding: "8px 14px",
    fontSize: 22,
    fontWeight: 800,
    fontFamily: th.font.family,
    borderRadius: 14,
    border: "2px solid " + col,
    background: used ? th.fill.secondary : th.bg.elevated,
    color: th.text.primary,
    cursor: "pointer",
  });

  return (
    <Screen>
      <div data-testid="play-screen" data-world={saved.worldIndex}>
        <div style={{ ...row, justifyContent: "space-between", marginBottom: 12 }}>
          <button type="button" data-testid="back-map" style={smallBtn} onClick={onMap}>
            ← Mapa
          </button>
          <div style={{ fontSize: 18, fontWeight: 800 }}>
            {profile.avatar} {world.icon} {world.name}
          </div>
          <div style={{ ...row, gap: 8 }}>
            <Chip testId="score">✅ {saved.score}</Chip>
            <Chip testId="streak">🔥 {saved.streak}</Chip>
            <button type="button" data-testid="sound-toggle" style={smallBtn} onClick={onToggleSound}>
              {profile.sound ? "🔊" : "🔇"}
            </button>
          </div>
        </div>
        <div style={{ height: 14, borderRadius: 7, background: th.fill.secondary, overflow: "hidden", marginBottom: 6 }}>
          <div style={{ height: "100%", width: ((saved.idx + (saved.checked ? 1 : 0)) / saved.round.length) * 100 + "%", background: col, borderRadius: 7 }} />
        </div>
        <div data-testid="progress-label" style={{ fontSize: 14, color: th.text.secondary, marginBottom: 14 }}>
          Reto {saved.idx + 1} de {saved.round.length}
        </div>

        <div style={{ ...card, border: "3px solid " + col, textAlign: "center" }}>
          <div data-testid="prompt" style={{ fontSize: 18, fontWeight: 800, color: th.text.secondary, marginBottom: 8 }}>
            {q.p}
          </div>
          {q.e ? (
            <div data-testid="prompt-emoji" style={{ fontSize: q.e.length > 12 ? 34 : 64, fontWeight: 800, lineHeight: 1.2, margin: "6px 0 10px" }}>
              {q.e}
            </div>
          ) : null}
          {q.k === "c" && q.t ? (
            <div data-testid="prompt-sentence" style={{ fontSize: 24, fontWeight: 800, marginBottom: 10, lineHeight: 1.35 }}>
              {q.t}
            </div>
          ) : null}
          {preSpeak ? (
            <button type="button" data-testid="listen" style={{ ...smallBtn, marginBottom: 12 }} onClick={() => onSpeak(preSpeak)}>
              🔊 Escuchar
            </button>
          ) : null}

          {q.k === "c" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 6 }}>
              {item.opts.map((option, index) => (
                <button key={option + index} type="button" data-testid="choice" style={optStyle(option)} onClick={() => { if (!saved.checked) onPick(option); }}>
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div
                data-testid="answer-tray"
                style={{ ...row, justifyContent: "center", minHeight: 64, padding: 10, borderRadius: 16, border: "2px dashed " + th.border.strong, marginBottom: 14, gap: 8 }}
              >
                {q.k === "s"
                  ? item.tiles.map((tile, index) => (
                      <button
                        key={"slot" + tile.id}
                        type="button"
                        data-testid="spell-slot"
                        style={{ ...tileStyle(false), opacity: builtVals[index] ? 1 : 0.35 }}
                        onClick={() => {
                          if (!saved.checked && index < saved.built.length) onRemoveBuilt(index);
                        }}
                      >
                        {builtVals[index] || "_"}
                      </button>
                    ))
                  : saved.built.length === 0
                    ? <span style={{ fontSize: 16, color: th.text.tertiary }}>Toca las palabras en orden</span>
                    : saved.built.map((id, index) => (
                        <button key={"b" + id} type="button" data-testid="order-built" style={tileStyle(false)} onClick={() => { if (!saved.checked) onRemoveBuilt(index); }}>
                          {builtVals[index]}
                        </button>
                      ))}
              </div>
              <div style={{ ...row, justifyContent: "center", gap: 8, marginBottom: 14 }}>
                {item.tiles.map((tile: Tile) => {
                  const used = saved.built.indexOf(tile.id) >= 0;
                  return (
                    <button
                      key={"t" + tile.id}
                      type="button"
                      data-testid="bank-tile"
                      data-value={tile.v}
                      disabled={used || saved.checked}
                      style={{ ...tileStyle(used), visibility: used ? "hidden" : "visible" }}
                      onClick={() => {
                        if (!saved.checked && !used) onPushTile(tile.id);
                      }}
                    >
                      {tile.v}
                    </button>
                  );
                })}
              </div>
              {!saved.checked ? (
                <div style={{ ...row, justifyContent: "center" }}>
                  <button type="button" data-testid="clear-tiles" style={bigBtn(false)} onClick={onClear}>
                    ↩️ Borrar
                  </button>
                  <button type="button" data-testid="check" style={bigBtn(true, !full)} disabled={!full} onClick={onCheck}>
                    ✅ Comprobar
                  </button>
                </div>
              ) : null}
              <span data-testid="built-text" hidden>
                {builtText(item, saved.built)}
              </span>
            </div>
          )}

          {saved.checked ? (
            <div
              data-testid="feedback"
              data-ok={saved.ok ? "true" : "false"}
              aria-live="polite"
              style={{ marginTop: 16, padding: 14, borderRadius: 16, background: saved.ok ? th.fill.successSubtle : th.fill.dangerSubtle, border: "2px solid " + (saved.ok ? th.text.success : th.text.danger) }}
            >
              <div style={{ fontSize: 24, fontWeight: 800 }}>
                {saved.ok ? (saved.streak >= 3 ? "🔥 ¡Racha de " + saved.streak + "! +15 🪙" : "🎉 ¡Muy bien! +10 🪙") : "🙈 ¡Casi!"}
              </div>
              {!saved.ok ? (
                <div style={{ fontSize: 19, marginTop: 6 }}>
                  La respuesta es: <b>{correctText}</b>
                </div>
              ) : null}
              <div style={{ ...row, justifyContent: "center", marginTop: 12 }}>
                <button type="button" data-testid="listen-answer" style={smallBtn} onClick={() => onSpeak(answerSpeech(q))}>
                  🔊 Escuchar
                </button>
                <button type="button" data-testid="next" style={bigBtn(true)} onClick={onNext}>
                  {saved.idx + 1 < saved.round.length ? "Siguiente ➡️" : "Ver resultado 🏁"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Screen>
  );
}
