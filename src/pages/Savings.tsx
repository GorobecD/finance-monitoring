import { useState } from "react";
import { useStore } from "../store";
import { Bar, DelBtn, Empty, Field, Modal, Panel, Ring, Stat, num } from "../ui";
import { cushionInfo, daysBetween, fmt, potBalance, todayStr, uid } from "../calc";
import type { Pot } from "../types";

export default function Savings() {
  const { data } = useStore();
  const cush = cushionInfo(data);
  const [potEdit, setPotEdit] = useState<Pot | "new" | null>(null);
  const [move, setMove] = useState<{ potId: string; out: boolean } | null>(null);
  const goals = data.pots.filter((p) => !p.isCushion);

  const quick = (potId: string, out: boolean) => setMove({ potId, out });

  return (
    <div className="grid">
      <Panel title="ФІНАНСОВА ПОДУШКА" className="span-12" accent="green">
        <div className="cushion-big">
          <Ring pct={cush.pct} size={170} label={`${Math.round(cush.pct * 100)}%`} sub={`${cush.months.toFixed(1)} / ${data.settings.cushionMonths} міс`} />
          <div className="stats-row">
            <Stat label="НАКОПИЧЕНО" value={fmt(cush.balance)} tone="green" />
            <Stat label="ЦІЛЬ" value={cush.target > 0 ? fmt(cush.target) : "—"} sub={`${data.settings.cushionMonths} × середні витрати`} tone="cyan" />
            <Stat label="СЕРЕДНІ ВИТРАТИ / МІС" value={fmt(cush.avg)} sub="за останні 3 міс з даними" tone="magenta" />
            <Stat
              label="ЗАЛИШИЛОСЬ"
              value={fmt(Math.max(0, cush.target - cush.balance))}
              sub={cush.pct >= 1 ? "подушка повна ✓ — 20% тепер в інвестиції" : "пріоритет №1 для 20% із ЗП"}
              tone="yellow"
            />
          </div>
          {cush.pot && (
            <div className="col gap">
              <button className="btn green" onClick={() => quick(cush.pot!.id, false)}>
                + Поповнити
              </button>
              <button className="btn ghost" onClick={() => quick(cush.pot!.id, true)}>
                − Зняти
              </button>
            </div>
          )}
        </div>
      </Panel>

      <Panel
        title="ЦІЛІ ЗАОЩАДЖЕНЬ"
        className="span-12"
        accent="yellow"
        right={
          <button className="btn primary sm" onClick={() => setPotEdit("new")}>
            + Ціль
          </button>
        }
      >
        {goals.length === 0 ? (
          <Empty>Додай ціль: ноутбук, відпустка, авто… — і побачиш, скільки відкладати щомісяця.</Empty>
        ) : (
          <div className="cards">
            {goals.map((p) => {
              const bal = potBalance(data, p.id);
              const left = Math.max(0, p.target - bal);
              const monthsLeft = p.deadline ? Math.max(1, Math.ceil(daysBetween(todayStr(), p.deadline) / 30.4)) : 0;
              const perMonth = p.deadline && left > 0 ? left / monthsLeft : 0;
              const overdue = p.deadline ? p.deadline < todayStr() && left > 0 : false;
              return (
                <div key={p.id} className="goal-card">
                  <div className="goal-head">
                    <span className="goal-ico">{p.icon}</span>
                    <span className="goal-name">{p.name}</span>
                    <button className="icon-btn" onClick={() => setPotEdit(p)}>
                      ✎
                    </button>
                  </div>
                  <div className="goal-amt">
                    {fmt(bal)} {p.target > 0 && <span className="muted">/ {fmt(p.target)}</span>}
                  </div>
                  {p.target > 0 && <Bar value={bal} max={p.target} tone={bal >= p.target ? "green" : "yellow"} />}
                  <div className="goal-meta muted">
                    {p.target > 0 && bal >= p.target
                      ? "✓ ціль досягнута"
                      : overdue
                        ? `дедлайн минув · бракує ${fmt(left)}`
                        : perMonth > 0
                          ? `${fmt(perMonth)}/міс до ${p.deadline}`
                          : p.target > 0
                            ? `бракує ${fmt(left)}`
                            : "без цільової суми"}
                  </div>
                  <div className="row gap">
                    <button className="btn green sm" onClick={() => quick(p.id, false)}>
                      + Поповнити
                    </button>
                    <button className="btn ghost sm" onClick={() => quick(p.id, true)}>
                      − Зняти
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
      {potEdit && <PotModal pot={potEdit === "new" ? null : potEdit} onClose={() => setPotEdit(null)} />}
      {move && <MoveModal potId={move.potId} out={move.out} onClose={() => setMove(null)} />}
    </div>
  );
}

function MoveModal({ potId, out, onClose }: { potId: string; out: boolean; onClose: () => void }) {
  const { data, update } = useStore();
  const pot = data.pots.find((p) => p.id === potId)!;
  const [amount, setAmount] = useState("");
  const save = () => {
    const v = num(amount);
    if (v <= 0) return;
    const sign = out ? -1 : 1;
    update((d) => d.txs.push({ id: uid(), date: todayStr(), type: "transfer", amount: v * sign, currency: "UAH", uah: v * sign, potId }));
    onClose();
  };
  return (
    <Modal title={`${out ? "Зняти з" : "Поповнити"}: ${pot.name}`} onClose={onClose}>
      <div className="form-grid">
        <Field label="Сума, ₴" wide>
          <input autoFocus inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} />
        </Field>
      </div>
      <div className="hint">{out ? "Гроші повернуться у вільні кошти." : "Сума спишеться з вільних коштів."}</div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>
          Скасувати
        </button>
        <button className="btn primary" onClick={save}>
          Зберегти
        </button>
      </div>
    </Modal>
  );
}

function PotModal({ pot, onClose }: { pot: Pot | null; onClose: () => void }) {
  const { data, update } = useStore();
  const [name, setName] = useState(pot?.name ?? "");
  const [icon, setIcon] = useState(pot?.icon ?? "★");
  const [target, setTarget] = useState(pot?.target ? String(pot.target) : "");
  const [deadline, setDeadline] = useState(pot?.deadline ?? "");
  const bal = pot ? potBalance(data, pot.id) : 0;
  const save = () => {
    if (!name.trim()) return;
    update((d) => {
      const p: Pot = { id: pot?.id ?? uid(), name: name.trim(), icon: icon || "★", target: num(target), deadline: deadline || undefined };
      const i = d.pots.findIndex((x) => x.id === p.id);
      if (i >= 0) d.pots[i] = p;
      else d.pots.push(p);
    });
    onClose();
  };
  return (
    <Modal title={pot ? "Ціль" : "Нова ціль"} onClose={onClose}>
      <div className="form-grid">
        <Field label="Назва">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Символ">
          <input value={icon} maxLength={2} onChange={(e) => setIcon(e.target.value)} />
        </Field>
        <Field label="Цільова сума, ₴">
          <input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
        </Field>
        <Field label="Дедлайн">
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
      </div>
      <div className="modal-actions">
        {pot && (
          <div className="mr-auto">
            {Math.abs(bal) > 0.5 ? (
              <span className="muted small">спершу зніми {fmt(bal)}</span>
            ) : (
              <DelBtn
                onDelete={() => {
                  update((d) => {
                    d.pots = d.pots.filter((x) => x.id !== pot.id);
                    d.txs = d.txs.filter((t) => t.potId !== pot.id);
                  });
                  onClose();
                }}
              />
            )}
          </div>
        )}
        <button className="btn ghost" onClick={onClose}>
          Скасувати
        </button>
        <button className="btn primary" onClick={save}>
          Зберегти
        </button>
      </div>
    </Modal>
  );
}
