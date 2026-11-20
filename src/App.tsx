import { useEffect, useState } from "react";
import { MapScreen } from "./components/MapScreen";
import { PlayScreen } from "./components/PlayScreen";
import { ResultScreen } from "./components/ResultScreen";
import { WhoScreen } from "./components/WhoScreen";
import { answerSpeech, buildRound, coinsForAnswer, isBuiltCorrect, isUnlocked, starsFor } from "./game";
import { AVATARS, cleanName } from "./profile";
import { primeVoices, speak, stopSpeech } from "./speech";
import { SCHEMA_VERSION, loadStore, makeProfile, removeProfile, saveStore, updateProfile } from "./storage";
import { theme as th } from "./theme";
import type { Profile, SavedRound, Screen as ScreenName, Store } from "./types";
import { Screen, card } from "./ui";
import { WORLDS } from "./worlds";

function withAnswer(profile: Profile, round: SavedRound, correct: boolean, picked: string | null): Profile {
  const next = coinsForAnswer(round.streak, correct);
  return {
    ...profile,
    round: {
      ...round,
      picked,
      checked: true,
      ok: correct,
      streak: next.streak,
      score: round.score + (correct ? 1 : 0),
      earned: round.earned + next.gain,
    },
  };
}

export default function App() {
  const [gate] = useState(loadStore);
  const [store, setStore] = useState<Store | null>(gate.status === "ready" ? gate.store : null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [screen, setScreen] = useState<ScreenName>("who");

  const profile = store?.profiles.find((item) => item.id === profileId) ?? null;

  useEffect(() => {
    primeVoices();
  }, []);

  useEffect(() => {
    if (gate.status !== "ready") return;
    if (!profile) {
      if (screen !== "who") setScreen("who");
      return;
    }
    if (screen === "play" && !profile.round) setScreen(profile.pendingResult ? "result" : "map");
    else if (screen === "result" && !profile.pendingResult) setScreen("map");
  }, [gate.status, profile, screen]);

  const update = (fn: (current: Store) => Store) => {
    setStore((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      saveStore(next);
      return next;
    });
  };

  const patch = (id: string, fn: (current: Profile) => Profile) => {
    update((current) => updateProfile(current, id, fn));
  };

  if (gate.status === "future" || !store) {
    return (
      <Screen>
        <div style={card}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>🚀 English Quest</h1>
          <p style={{ fontSize: 18, lineHeight: 1.45, color: th.text.secondary }}>
            En este dispositivo hay partidas guardadas con una versión más nueva del juego. No las he borrado. Abre English Quest actualizado para seguir con esos jugadores.
          </p>
        </div>
      </Screen>
    );
  }

  const select = (id: string) => {
    const next = store.profiles.find((item) => item.id === id);
    if (!next) return;
    stopSpeech();
    setProfileId(id);
    if (next.round) setScreen("play");
    else if (next.pendingResult) setScreen("result");
    else setScreen("map");
  };

  const create = (name: string, avatar: string) => {
    const clean = cleanName(name);
    if (!clean || !AVATARS.includes(avatar)) return;
    const created = makeProfile(clean, avatar);
    update((current) => ({ version: SCHEMA_VERSION, profiles: [...current.profiles, created] }));
    setProfileId(created.id);
    setScreen("map");
  };

  const startWorld = (worldIndex: number) => {
    if (!profile || !isUnlocked(profile.stars, worldIndex) || worldIndex < 0 || worldIndex >= WORLDS.length) return;
    stopSpeech();
    const round = buildRound(worldIndex);
    const id = profile.id;
    patch(id, (current) => ({
      ...current,
      pendingResult: null,
      round: { worldIndex, round, idx: 0, picked: null, built: [], checked: false, ok: false, score: 0, streak: 0, earned: 0 },
    }));
    setScreen("play");
  };

  const toggleSound = () => {
    if (!profile) return;
    const id = profile.id;
    patch(id, (current) => ({ ...current, sound: !current.sound }));
  };

  const onPick = (option: string) => {
    if (!profile?.round || profile.round.checked) return;
    const item = profile.round.round[profile.round.idx];
    if (!item || item.q.k !== "c") return;
    const id = profile.id;
    patch(id, (current) => {
      const round = current.round;
      if (!round || round.checked) return current;
      const live = round.round[round.idx];
      if (!live || live.q.k !== "c") return current;
      return withAnswer(current, round, option === live.q.a, option);
    });
    if (profile.sound) speak(answerSpeech(item.q));
  };

  const onPushTile = (tileId: number) => {
    if (!profile) return;
    const id = profile.id;
    patch(id, (current) => {
      const round = current.round;
      if (!round || round.checked) return current;
      const item = round.round[round.idx];
      if (!item || item.q.k === "c" || round.built.includes(tileId)) return current;
      if (!item.tiles.some((tile) => tile.id === tileId)) return current;
      return { ...current, round: { ...round, built: round.built.concat(tileId) } };
    });
  };

  const onRemoveBuilt = (index: number) => {
    if (!profile) return;
    const id = profile.id;
    patch(id, (current) => {
      const round = current.round;
      if (!round || round.checked || index < 0 || index >= round.built.length) return current;
      return { ...current, round: { ...round, built: round.built.slice(0, index).concat(round.built.slice(index + 1)) } };
    });
  };

  const onClear = () => {
    if (!profile) return;
    const id = profile.id;
    patch(id, (current) => {
      const round = current.round;
      if (!round || round.checked) return current;
      return { ...current, round: { ...round, built: [] } };
    });
  };

  const onCheck = () => {
    if (!profile?.round || profile.round.checked) return;
    const item = profile.round.round[profile.round.idx];
    if (!item || item.q.k === "c" || profile.round.built.length !== item.tiles.length) return;
    const id = profile.id;
    patch(id, (current) => {
      const round = current.round;
      if (!round || round.checked) return current;
      const live = round.round[round.idx];
      if (!live || live.q.k === "c" || round.built.length !== live.tiles.length) return current;
      return withAnswer(current, round, isBuiltCorrect(live, round.built), null);
    });
    if (profile.sound) speak(answerSpeech(item.q));
  };

  const finishRound = () => {
    if (!profile?.round) return;
    const id = profile.id;
    stopSpeech();
    patch(id, (current) => {
      const round = current.round;
      if (!round) return current;
      const stars = starsFor(round.score, round.round.length);
      const wasLockedNext = round.worldIndex + 1 < WORLDS.length && current.stars[round.worldIndex] === 0;
      return {
        ...current,
        stars: current.stars.map((value, index) => (index === round.worldIndex ? Math.max(value, stars) : value)),
        bestScores: current.bestScores.map((value, index) => (index === round.worldIndex ? Math.max(value, round.score) : value)),
        coins: current.coins + round.earned,
        round: null,
        pendingResult: {
          worldIndex: round.worldIndex,
          stars,
          score: round.score,
          total: round.round.length,
          unlocked: wasLockedNext && stars > 0,
          earned: round.earned,
        },
      };
    });
    setScreen("result");
  };

  const onNext = () => {
    if (!profile?.round?.checked) return;
    const id = profile.id;
    const round = profile.round;
    stopSpeech();
    if (round.idx + 1 < round.round.length) {
      patch(id, (current) => {
        const live = current.round;
        if (!live || !live.checked || live.idx + 1 >= live.round.length) return current;
        return { ...current, round: { ...live, idx: live.idx + 1, picked: null, built: [], checked: false, ok: false } };
      });
      return;
    }
    finishRound();
  };

  if (screen === "who" || !profile) {
    return <WhoScreen profiles={store.profiles} onSelect={select} onCreate={create} />;
  }

  if (screen === "play" && profile.round) {
    return (
      <PlayScreen
        profile={profile}
        onMap={() => {
          stopSpeech();
          setScreen("map");
        }}
        onToggleSound={toggleSound}
        onPick={onPick}
        onPushTile={onPushTile}
        onRemoveBuilt={onRemoveBuilt}
        onClear={onClear}
        onCheck={onCheck}
        onNext={onNext}
        onSpeak={speak}
      />
    );
  }

  if (screen === "result" && profile.pendingResult) {
    const result = profile.pendingResult;
    return (
      <ResultScreen
        profile={profile}
        result={result}
        onToggleSound={toggleSound}
        onRetry={() => startWorld(result.worldIndex)}
        onMap={() => {
          stopSpeech();
          patch(profile.id, (current) => ({ ...current, pendingResult: null }));
          setScreen("map");
        }}
        onNext={() => {
          if (result.stars > 0 && result.worldIndex + 1 < WORLDS.length) startWorld(result.worldIndex + 1);
        }}
      />
    );
  }

  return (
    <MapScreen
      profile={profile}
      onStart={startWorld}
      onContinue={() => {
        if (profile.round) setScreen("play");
      }}
      onSwitch={() => {
        stopSpeech();
        setProfileId(null);
        setScreen("who");
      }}
      onToggleSound={toggleSound}
      onSaveProfile={(name, avatar) => {
        const clean = cleanName(name);
        if (!clean || avatar.length < 1 || avatar.length > 16) return;
        patch(profile.id, (current) => ({ ...current, name: clean, avatar }));
      }}
      onReset={() => {
        stopSpeech();
        patch(profile.id, (current) => ({
          ...current,
          stars: current.stars.map(() => 0),
          coins: 0,
          bestScores: current.bestScores.map(() => 0),
          round: null,
          pendingResult: null,
        }));
        setScreen("map");
      }}
      onDelete={() => {
        stopSpeech();
        const id = profile.id;
        update((current) => removeProfile(current, id));
        setProfileId(null);
        setScreen("who");
      }}
    />
  );
}
