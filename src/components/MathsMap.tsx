import { useState } from "react";
import { isUnlocked, starRow, totalStars } from "../game";
import { MATHS_WORLDS } from "../maths/problems";
import { colorOf, theme as th } from "../theme";
import type { Profile } from "../types";
import { Chip, Screen, bigBtn, card, row, smallBtn } from "../ui";

export function MathsMap({
  profile,
  onStart,
  onContinue,
  onGames,
  onSwitch,
  onToggleSound,
  onReset,
}: {
  profile: Profile;
  onStart: (worldIndex: number) => void;
  onContinue: () => void;
  onGames: () => void;
  onSwitch: () => void;
  onToggleSound: () => void;
  onReset: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const [arm, setArm] = useState<number | null>(null);
  const saved = profile.maths.round;
  const stars = totalStars(profile.maths.stars);

  const askStart = (index: number) => {
    if (saved) setArm(index);
    else onStart(index);
  };

  return (
    <Screen>
      <div data-testid="maths-map">
        <div style={{ ...row, justifyContent: "space-between", marginBottom: 14 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>🧮 Missió Problemes</h1>
          <div style={{ ...row, gap: 8 }}>
            <Chip>
              {profile.avatar} {profile.name}
            </Chip>
            <button type="button" data-testid="back-games" style={smallBtn} onClick={onGames}>
              Tria joc
            </button>
            <button type="button" style={smallBtn} onClick={onSwitch}>
              Canviar jugador
            </button>
            <Chip testId="maths-coins">🪙 {profile.maths.coins}</Chip>
            <Chip testId="maths-stars">
              ⭐ {stars}/{MATHS_WORLDS.length * 3}
            </Chip>
            <button type="button" style={smallBtn} onClick={onToggleSound}>
              {profile.sound ? "🔊 So" : "🔇 Sense so"}
            </button>
          </div>
        </div>
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Llegeix abans de calcular</div>
          <p style={{ fontSize: 17, color: th.text.secondary, lineHeight: 1.45 }}>
            Cada problema té 4 passos: Què en sabem? Què volem saber? Com ho esbrinem? Solució. Si t'equivoques, hi ha una pista i ho pots tornar a provar. Les estrelles són pels problemes que fas bé a la primera. 5 de 6 obren el món següent.
          </p>
        </div>
        {saved ? (
          <div style={{ ...card, marginBottom: 16, border: "3px solid " + colorOf(saved.worldIndex) }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
              ⏸️ Missió a mitges a {MATHS_WORLDS[saved.worldIndex].icon} {MATHS_WORLDS[saved.worldIndex].name}
            </div>
            <p style={{ fontSize: 16, color: th.text.secondary, marginBottom: 10 }}>
              Problema {saved.index + 1} de {saved.order.length}
            </p>
            <button type="button" data-testid="maths-continue" style={bigBtn(true)} onClick={onContinue}>
              ▶️ Continuar
            </button>
          </div>
        ) : null}
        {arm !== null ? (
          <div style={{ ...card, marginBottom: 16 }}>
            <p style={{ fontSize: 17, marginBottom: 10 }}>Vols una missió nova a {MATHS_WORLDS[arm].name}? Es deixa la missió a mitges.</p>
            <div style={row}>
              <button
                type="button"
                style={smallBtn}
                onClick={() => {
                  const index = arm;
                  setArm(null);
                  onStart(index);
                }}
              >
                Sí, començar
              </button>
              <button type="button" style={smallBtn} onClick={() => setArm(null)}>
                Cancel·lar
              </button>
            </div>
          </div>
        ) : null}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {MATHS_WORLDS.map((world, index) => {
            const open = isUnlocked(profile.maths.stars, index);
            const col = colorOf(index);
            const here = saved?.worldIndex === index;
            return (
              <div
                key={world.name}
                data-testid="maths-world"
                data-index={index}
                data-open={open ? "true" : "false"}
                style={{ ...card, padding: 14, textAlign: "center", opacity: open ? 1 : 0.55, border: "3px solid " + (open ? col : th.border.default), display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: th.text.secondary }}>MÓN {index + 1}</div>
                <div style={{ width: 76, height: 76, borderRadius: 38, background: col + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>{open ? world.icon : "🔒"}</div>
                <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>{world.name}</div>
                <div style={{ fontSize: 13, color: th.text.secondary }}>{world.sub}</div>
                <div style={{ fontSize: 20 }}>{starRow(profile.maths.stars[index] ?? 0)}</div>
                {(profile.maths.bestScores[index] ?? 0) > 0 ? <div style={{ fontSize: 14, fontWeight: 800, color: th.text.secondary }}>Millor: {profile.maths.bestScores[index]}/6</div> : null}
                {open ? (
                  here ? (
                    <div style={{ ...row, width: "100%" }}>
                      <button type="button" style={{ ...smallBtn, width: "100%" }} onClick={onContinue}>
                        ▶️ Continuar
                      </button>
                      <button type="button" data-testid="maths-start" style={{ ...smallBtn, width: "100%" }} onClick={() => askStart(index)}>
                        🔁 Nova missió
                      </button>
                    </div>
                  ) : (
                    <button type="button" data-testid="maths-start" style={{ ...smallBtn, width: "100%" }} onClick={() => askStart(index)}>
                      {(profile.maths.stars[index] ?? 0) > 0 ? "Una altra vegada" : "Comença!"}
                    </button>
                  )
                ) : (
                  <div style={{ fontSize: 14, fontWeight: 800, color: th.text.secondary }}>Tancat</div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ ...card, marginTop: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Per a les famílies</div>
          <p style={{ fontSize: 15, color: th.text.secondary, lineHeight: 1.45, marginBottom: 10 }}>
            El joc entrena la comprensió del problema: dades, pregunta, pla i solució. El progrés de problemes no esborra l'anglès.
          </p>
          {confirm ? (
            <div style={row}>
              <span>Vols esborrar només les estrelles i monedes de problemes?</span>
              <button type="button" data-testid="confirm-reset-maths" style={smallBtn} onClick={onReset}>
                Sí, esborrar
              </button>
              <button type="button" style={smallBtn} onClick={() => setConfirm(false)}>
                Cancel·lar
              </button>
            </div>
          ) : (
            <button type="button" style={smallBtn} onClick={() => setConfirm(true)}>
              ↺ Esborrar progrés de problemes
            </button>
          )}
        </div>
      </div>
    </Screen>
  );
}
