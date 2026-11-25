import { useEffect, useState } from "react";
import { isUnlocked, starRow, totalStars } from "../game";
import { AVATARS, NAME_MAX, cleanName } from "../profile";
import { colorOf, theme as th } from "../theme";
import type { Profile } from "../types";
import { WORLDS } from "../worlds";
import { Chip, Screen, bigBtn, card, row, smallBtn } from "../ui";

export function MapScreen({
  profile,
  onStart,
  onContinue,
  onGames,
  onSwitch,
  onToggleSound,
  onSaveProfile,
  onReset,
  onDelete,
}: {
  profile: Profile;
  onStart: (worldIndex: number) => void;
  onContinue: () => void;
  onGames: () => void;
  onSwitch: () => void;
  onToggleSound: () => void;
  onSaveProfile: (name: string, avatar: string) => void;
  onReset: () => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [nameError, setNameError] = useState("");
  const [confirm, setConfirm] = useState<null | "reset" | "delete">(null);
  const [arm, setArm] = useState<number | null>(null);
  const stars = totalStars(profile.stars);
  const saved = profile.round;
  const avatarChoices = AVATARS.includes(profile.avatar) ? AVATARS : [profile.avatar, ...AVATARS];

  useEffect(() => {
    setName(profile.name);
    setAvatar(profile.avatar);
    setNameError("");
    setConfirm(null);
    setArm(null);
  }, [profile.id, profile.name, profile.avatar]);

  const askStart = (index: number) => {
    if (saved) setArm(index);
    else onStart(index);
  };

  return (
    <Screen>
      <div data-testid="map-screen">
        <div style={{ ...row, justifyContent: "space-between", marginBottom: 14 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>🚀 English Quest</h1>
          <div style={{ ...row, gap: 8 }}>
            <Chip testId="player-chip">
              {profile.avatar} {profile.name}
            </Chip>
            <button type="button" data-testid="back-games" style={smallBtn} onClick={onGames}>
              Tria joc
            </button>
            <button type="button" data-testid="switch-player" style={smallBtn} onClick={onSwitch}>
              Cambiar jugador
            </button>
            <Chip testId="coins">🪙 {profile.coins}</Chip>
            <Chip testId="star-total">
              ⭐ {stars}/{WORLDS.length * 3}
            </Chip>
            <button type="button" data-testid="sound-toggle" style={smallBtn} onClick={onToggleSound}>
              {profile.sound ? "🔊 Sonido" : "🔇 Sin sonido"}
            </button>
          </div>
        </div>

        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>🗺️ El mapa de los mundos</div>
          <p style={{ fontSize: 17, color: th.text.secondary, lineHeight: 1.45 }}>
            Cada mundo tiene 10 retos. Acierta 7 o más para ganar estrellas y abrir el siguiente mundo. 7 aciertos = ⭐, 8–9 = ⭐⭐, 10 = ⭐⭐⭐. ¡Cada acierto da 10 monedas y 3 seguidos activan la racha 🔥!
          </p>
        </div>

        {saved ? (
          <div style={{ ...card, marginBottom: 16, border: "3px solid " + colorOf(saved.worldIndex) }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
              ⏸️ Partida a medias en {WORLDS[saved.worldIndex].icon} {WORLDS[saved.worldIndex].name}
            </div>
            <p style={{ fontSize: 16, color: th.text.secondary, marginBottom: 10 }}>
              Reto {saved.idx + 1} de {saved.round.length} · {saved.score} aciertos
            </p>
            <button type="button" data-testid="continue-banner" style={bigBtn(true)} onClick={onContinue}>
              ▶️ Continuar
            </button>
          </div>
        ) : null}

        {arm !== null ? (
          <div data-testid="confirm-new-round" style={{ ...card, marginBottom: 16 }}>
            <p style={{ fontSize: 17, marginBottom: 10 }}>
              ¿Nueva partida en {WORLDS[arm].icon} {WORLDS[arm].name}? Se sustituye la partida a medias.
            </p>
            <div style={row}>
              <button
                type="button"
                data-testid="confirm-start"
                style={smallBtn}
                onClick={() => {
                  const index = arm;
                  setArm(null);
                  onStart(index);
                }}
              >
                Sí, empezar
              </button>
              <button type="button" style={smallBtn} onClick={() => setArm(null)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {WORLDS.map((world, index) => {
            const open = isUnlocked(profile.stars, index);
            const col = colorOf(index);
            const here = saved?.worldIndex === index;
            return (
              <div
                key={world.name}
                data-testid="world"
                data-index={index}
                data-open={open ? "true" : "false"}
                style={{
                  ...card,
                  padding: 14,
                  textAlign: "center",
                  opacity: open ? 1 : 0.55,
                  border: "3px solid " + (open ? col : th.border.default),
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: th.text.secondary }}>MUNDO {index + 1}</div>
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 38,
                    background: col + th.dataviz.areaAlpha,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 44,
                  }}
                >
                  {open ? world.icon : "🔒"}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>{world.name}</div>
                <div style={{ fontSize: 13, color: th.text.secondary }}>{world.sub}</div>
                <div style={{ fontSize: 20 }} data-testid="world-stars">
                  {starRow(profile.stars[index] ?? 0)}
                </div>
                {(profile.bestScores[index] ?? 0) > 0 ? (
                  <div data-testid="best-score" style={{ fontSize: 14, fontWeight: 800, color: th.text.secondary }}>
                    Mejor: {profile.bestScores[index]}/10
                  </div>
                ) : null}
                {open ? (
                  here ? (
                    <div style={{ ...row, justifyContent: "center", width: "100%" }}>
                      <button type="button" data-testid="continue-round" style={{ ...smallBtn, width: "100%" }} onClick={onContinue}>
                        ▶️ Continuar
                      </button>
                      <button type="button" data-testid="new-round" style={{ ...smallBtn, width: "100%" }} onClick={() => askStart(index)}>
                        🔁 Nueva partida
                      </button>
                    </div>
                  ) : (
                    <button type="button" data-testid="start-world" style={{ ...smallBtn, width: "100%" }} onClick={() => askStart(index)}>
                      {(profile.stars[index] ?? 0) > 0 ? "¡Superado! Jugar otra vez" : "¡Jugar!"}
                    </button>
                  )
                ) : (
                  <div style={{ fontSize: 14, fontWeight: 800, color: th.text.secondary }}>Bloqueado</div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ ...card, marginTop: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>👨‍👩‍👦 Zona de padres</div>
          <p style={{ fontSize: 15, color: th.text.secondary, marginBottom: 12, lineHeight: 1.45 }}>
            Contenido sacado de la hoja «English: contents to review». Las preguntas salen en orden aleatorio, así cada partida es distinta. El botón 🔊 usa voces británicas grabadas. Si falta un audio, el navegador lee en inglés si puede. El progreso de {profile.name} se guarda solo en este navegador (esquema v1), sin cuenta ni servidor.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              const clean = cleanName(name);
              if (!clean) {
                setNameError("Escribe un nombre de 1 a " + NAME_MAX + " letras.");
                return;
              }
              setNameError("");
              onSaveProfile(clean, avatar);
            }}
          >
            <label htmlFor="rename-player" style={{ display: "block", fontWeight: 800, marginBottom: 6 }}>
              Nombre del jugador
            </label>
            <input
              id="rename-player"
              data-testid="rename-input"
              value={name}
              maxLength={NAME_MAX}
              autoComplete="off"
              onChange={(event) => {
                setName(event.target.value);
                setNameError("");
              }}
            />
            <div style={{ fontWeight: 800, margin: "12px 0 8px" }}>Avatar</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {avatarChoices.map((item) => {
                const selected = item === avatar;
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setAvatar(item)}
                    style={{
                      width: 52,
                      height: 52,
                      fontSize: 28,
                      borderRadius: 14,
                      border: "3px solid " + (selected ? th.fill.primary : th.border.strong),
                      background: selected ? th.fill.secondary : th.bg.elevated,
                      cursor: "pointer",
                    }}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
            {nameError ? (
              <p role="alert" style={{ color: th.text.danger, fontWeight: 800, marginBottom: 8 }}>
                {nameError}
              </p>
            ) : null}
            <button type="submit" data-testid="save-profile" style={smallBtn}>
              Guardar nombre y avatar
            </button>
          </form>

          <div style={{ marginTop: 16 }}>
            {confirm === "reset" ? (
              <div style={row}>
                <span style={{ fontSize: 15 }}>¿Borrar estrellas, monedas y la partida de {profile.name}?</span>
                <button type="button" data-testid="confirm-reset" style={smallBtn} onClick={onReset}>
                  Sí, borrar progreso
                </button>
                <button type="button" style={smallBtn} onClick={() => setConfirm(null)}>
                  Cancelar
                </button>
              </div>
            ) : confirm === "delete" ? (
              <div style={row}>
                <span style={{ fontSize: 15 }}>¿Borrar el perfil de {profile.name}? No se puede deshacer.</span>
                <button type="button" data-testid="confirm-delete" style={smallBtn} onClick={onDelete}>
                  Sí, borrar perfil
                </button>
                <button type="button" style={smallBtn} onClick={() => setConfirm(null)}>
                  Cancelar
                </button>
              </div>
            ) : (
              <div style={row}>
                <button type="button" data-testid="reset-progress" style={smallBtn} onClick={() => setConfirm("reset")}>
                  ↺ Borrar progreso
                </button>
                <button type="button" data-testid="delete-profile" style={smallBtn} onClick={() => setConfirm("delete")}>
                  🗑️ Borrar perfil
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Screen>
  );
}
