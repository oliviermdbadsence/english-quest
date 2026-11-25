import { useState } from "react";
import { AVATARS, NAME_MAX, cleanName } from "../profile";
import type { Profile } from "../types";
import { totalStars } from "../game";
import { WORLDS } from "../worlds";
import { theme as th } from "../theme";
import { Chip, Screen, bigBtn, card, row } from "../ui";

export function WhoScreen({
  profiles,
  onSelect,
  onCreate,
}: {
  profiles: Profile[];
  onSelect: (id: string) => void;
  onCreate: (name: string, avatar: string) => void;
}) {
  const [open, setOpen] = useState(profiles.length === 0);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState("");

  const submit = () => {
    const clean = cleanName(name);
    if (!clean) {
      setError("Escribe un nombre de 1 a " + NAME_MAX + " letras.");
      return;
    }
    setError("");
    setName("");
    setOpen(false);
    onCreate(clean, avatar);
  };

  return (
    <Screen>
      <div data-testid="who-screen">
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 6 }}>🚀 English Quest</h1>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>¿Quién juega?</h2>
        <p style={{ fontSize: 18, color: th.text.secondary, lineHeight: 1.45, marginBottom: 16 }}>
          Elige tu jugador. Cada uno guarda sus mundos, estrellas y monedas en este dispositivo.
        </p>

        {profiles.length === 0 ? (
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ fontSize: 40, textAlign: "center" }}>👋</div>
            <p style={{ fontSize: 18, textAlign: "center", marginTop: 6 }}>Aún no hay jugadores. ¡Crea el primero!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12, marginBottom: 16 }}>
            {profiles.map((profile) => {
              const stars = totalStars(profile.stars);
              const notes = [
                profile.round ? "Inglés a medias" : profile.pendingResult ? "Inglés terminado" : "",
                profile.maths.round ? "Problemes a mitges" : profile.maths.pendingResult ? "Problemes acabats" : "",
              ].filter(Boolean);
              const resume = notes.length ? "⏸️ " + notes.join(" · ") : "Listo para jugar";
              return (
                <button
                  key={profile.id}
                  type="button"
                  data-testid="profile"
                  data-name={profile.name}
                  onClick={() => onSelect(profile.id)}
                  style={{
                    ...card,
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    fontFamily: th.font.family,
                    color: th.text.primary,
                    minHeight: 104,
                  }}
                >
                  <span style={{ fontSize: 52, lineHeight: 1 }} aria-hidden="true">
                    {profile.avatar}
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 22, fontWeight: 800 }}>{profile.name}</span>
                    <span style={{ fontSize: 16, color: th.text.secondary }}>
                      ⭐ {stars}/{WORLDS.length * 3} · 🪙 {profile.coins}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 800 }}>{resume}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {open ? (
          <form
            style={card}
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Nuevo jugador</div>
            <label htmlFor="player-name" style={{ display: "block", fontSize: 16, fontWeight: 800, marginBottom: 6 }}>
              Nombre
            </label>
            <input
              id="player-name"
              data-testid="player-name-input"
              value={name}
              maxLength={NAME_MAX}
              autoComplete="off"
              autoCapitalize="words"
              enterKeyHint="done"
              placeholder="Tu nombre"
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
            />
            <div style={{ fontSize: 16, fontWeight: 800, margin: "14px 0 8px" }}>Elige un avatar</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {AVATARS.map((item) => {
                const selected = item === avatar;
                return (
                  <button
                    key={item}
                    type="button"
                    data-testid="avatar-option"
                    data-avatar={item}
                    aria-pressed={selected}
                    onClick={() => setAvatar(item)}
                    style={{
                      width: 56,
                      height: 56,
                      fontSize: 30,
                      borderRadius: 16,
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
            {error ? (
              <p role="alert" style={{ color: th.text.danger, fontWeight: 800, marginTop: 12 }}>
                {error}
              </p>
            ) : null}
            <div style={{ ...row, marginTop: 16 }}>
              <button type="submit" data-testid="create-player" style={bigBtn(true)}>
                ¡A jugar!
              </button>
              {profiles.length > 0 ? (
                <button type="button" style={bigBtn(false)} onClick={() => setOpen(false)}>
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        ) : (
          <button type="button" data-testid="new-player" style={bigBtn(true)} onClick={() => setOpen(true)}>
            ➕ Nuevo jugador
          </button>
        )}
        <div style={{ marginTop: 18 }}>
          <Chip>Esquema v1 · solo este dispositivo</Chip>
        </div>
      </div>
    </Screen>
  );
}
