import { useState } from "react";
import { computeAnswer, formatAmount, sameAmount } from "../maths/expr";
import type { Problem } from "../maths/expr";
import { MATHS_WORLDS, problemById } from "../maths/problems";
import { colorOf, theme as th } from "../theme";
import type { MathsRound, Profile } from "../types";
import { Chip, Screen, bigBtn, card, row, smallBtn } from "../ui";

const STEPS = ["Què en sabem?", "Què volem saber?", "Com ho esbrinem?", "Solució"];

export function MathsPlay({
  profile,
  onPatchRound,
  onSolved,
  onMap,
  onRead,
}: {
  profile: Profile;
  onPatchRound: (round: MathsRound) => void;
  onSolved: (round: MathsRound) => void;
  onMap: () => void;
  onRead: (text: string) => void;
}) {
  const round = profile.maths.round;
  if (!round) return null;
  const world = MATHS_WORLDS[round.worldIndex];
  const problem = problemById(round.order[round.index] ?? "");
  if (!world || !problem) return null;
  const answer = computeAnswer(problem);

  const dirty = () => {
    if (round.clean) onPatchRound({ ...round, clean: false });
  };

  const advance = () => {
    if (round.step < 3) {
      onPatchRound({ ...round, step: round.step + 1 });
      return;
    }
    onSolved(round);
  };

  return (
    <Screen>
      <div data-testid="maths-play" data-step={round.step} data-problem={problem.id}>
        <div style={{ ...row, justifyContent: "space-between", marginBottom: 12 }}>
          <button type="button" data-testid="maths-back" style={smallBtn} onClick={onMap}>
            ← Mapa
          </button>
          <div style={{ fontSize: 18, fontWeight: 800 }}>
            {world.icon} {world.name}
          </div>
          <Chip>
            ✅ {round.score}
          </Chip>
        </div>
        <div style={{ fontSize: 14, color: th.text.secondary, marginBottom: 8 }}>
          Problema {round.index + 1} de {round.order.length} · {STEPS[round.step]}
        </div>
        <div style={{ height: 14, borderRadius: 7, background: th.fill.secondary, overflow: "hidden", marginBottom: 14 }}>
          <div style={{ height: "100%", width: ((round.index + round.step / 4) / round.order.length) * 100 + "%", background: colorOf(round.worldIndex) }} />
        </div>
        <div style={{ ...card, border: "3px solid " + colorOf(round.worldIndex) }}>
          <p data-testid="maths-story" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.45, marginBottom: 12 }}>
            {problem.story}
          </p>
          <button type="button" data-testid="read-aloud" style={{ ...smallBtn, marginBottom: 14 }} onClick={() => onRead(problem.story)}>
            🔊 Llegeix-me-ho
          </button>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>{STEPS[round.step]}</h2>
          {round.step === 0 ? <DataStep problem={problem} hintText={problem.dataHint} onDirty={dirty} onOk={advance} /> : null}
          {round.step === 1 ? <ChoiceStep options={problem.questions} testId="ask-option" onDirty={dirty} onOk={advance} /> : null}
          {round.step === 2 ? <ChoiceStep options={problem.plans} testId="plan-option" onDirty={dirty} onOk={advance} /> : null}
          {round.step === 3 ? <SolutionStep problem={problem} answer={answer} onDirty={dirty} onOk={advance} /> : null}
        </div>
      </div>
    </Screen>
  );
}

function DataStep({ problem, hintText, onDirty, onOk }: { problem: Problem; hintText: string; onDirty: () => void; onOk: () => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [hint, setHint] = useState("");
  const toggle = (id: string) => {
    setHint("");
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : current.concat(id)));
  };
  const check = () => {
    const useful = problem.facts.filter((fact) => fact.useful).map((fact) => fact.id);
    const good = useful.length === picked.length && useful.every((id) => picked.includes(id));
    if (!good) {
      setHint(hintText);
      onDirty();
      return;
    }
    onOk();
  };
  return (
    <div>
      <p style={{ fontSize: 17, color: th.text.secondary, marginBottom: 10 }}>Toca totes les dades que necessites. Les altres, no.</p>
      <div style={{ display: "grid", gap: 10 }}>
        {problem.facts.map((fact) => {
          const on = picked.includes(fact.id);
          return (
            <button
              key={fact.id}
              type="button"
              data-testid="fact"
              data-id={fact.id}
              aria-pressed={on}
              onClick={() => toggle(fact.id)}
              style={{ ...bigBtn(on), textAlign: "left" }}
            >
              {on ? "✓ " : ""}
              {fact.text}
            </button>
          );
        })}
      </div>
      {hint ? <Hint text={hint} /> : null}
      <button type="button" data-testid="check-data" style={{ ...bigBtn(true), marginTop: 14, width: "100%" }} onClick={check}>
        Això és el que sé
      </button>
    </div>
  );
}

function ChoiceStep({ options, testId, onDirty, onOk }: { options: Problem["questions"]; testId: string; onDirty: () => void; onOk: () => void }) {
  const [hint, setHint] = useState("");
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {options.map((option) => (
        <button
          key={option.text}
          type="button"
          data-testid={testId}
          style={{ ...bigBtn(false), textAlign: "left" }}
          onClick={() => {
            if (!option.ok) {
              setHint(option.hint);
              onDirty();
              return;
            }
            onOk();
          }}
        >
          {option.text}
        </button>
      ))}
      {hint ? <Hint text={hint} /> : null}
    </div>
  );
}

function SolutionStep({ problem, answer, onDirty, onOk }: { problem: Problem; answer: number; onDirty: () => void; onOk: () => void }) {
  const [typed, setTyped] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const [hint, setHint] = useState("");
  const [numberOk, setNumberOk] = useState(false);
  const choices = [answer, ...problem.traps.map((trap) => trap.value)];

  const checkNumber = () => {
    const fromText = typed.trim() ? sameAmount(typed, answer, problem.money) : false;
    const fromChip = picked === answer;
    if (fromText || (!typed.trim() && fromChip)) {
      setNumberOk(true);
      setHint("");
      return;
    }
    const parsedGuess = typed.trim() ? problem.traps.find((trap) => sameAmount(typed, trap.value, problem.money)) : undefined;
    const chipGuess = problem.traps.find((trap) => trap.value === picked);
    setHint(parsedGuess?.hint || chipGuess?.hint || problem.numberHint);
    onDirty();
  };

  if (!numberOk) {
    return (
      <div>
        <p style={{ fontSize: 17, color: th.text.secondary, marginBottom: 10 }}>Tria el nombre o escriu-lo.</p>
        <div style={{ display: "grid", gap: 10 }}>
          {choices.map((value) => (
            <button key={value} type="button" data-testid="number-option" aria-pressed={picked === value} style={bigBtn(picked === value)} onClick={() => { setPicked(value); setHint(""); }}>
              {formatAmount(value, problem.money)}
            </button>
          ))}
        </div>
        <label htmlFor="amount-input" style={{ display: "block", fontWeight: 800, margin: "12px 0 6px" }}>
          O escriu la resposta
        </label>
        <input id="amount-input" data-testid="amount-input" inputMode="decimal" value={typed} placeholder={problem.money ? "22,50" : "12"} onChange={(event) => setTyped(event.target.value)} />
        {hint ? <Hint text={hint} /> : null}
        <button type="button" data-testid="check-number" style={{ ...bigBtn(true), marginTop: 14, width: "100%" }} onClick={checkNumber}>
          Comprova el nombre
        </button>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>El nombre és {formatAmount(answer, problem.money)}. Quina frase ho diu sencer?</p>
      <div style={{ display: "grid", gap: 10 }}>
        {problem.sentences.map((sentence) => (
          <button
            key={sentence.text}
            type="button"
            data-testid="sentence-option"
            style={{ ...bigBtn(false), textAlign: "left" }}
            onClick={() => {
              if (!sentence.ok) {
                setHint(sentence.hint);
                onDirty();
                return;
              }
              onOk();
            }}
          >
            {sentence.text}
          </button>
        ))}
      </div>
      {hint ? <Hint text={hint} /> : null}
    </div>
  );
}

function Hint({ text }: { text: string }) {
  return (
    <div data-testid="hint" style={{ marginTop: 12, padding: 12, borderRadius: 14, background: "#fff4d6", border: "2px solid #e0a106", fontSize: 17, fontWeight: 700, lineHeight: 1.4 }}>
      Gairebé! {text}
    </div>
  );
}
