import { useEffect, useState } from "react";
import { useStore } from "../store";
import { Field, Panel, num } from "../ui";
import { dataLocation, defaultData, exportBackup, fetchNbuRates } from "../storage";
import { fmt, todayStr } from "../calc";
import type { Data } from "../types";
import { THEMES } from "../theme";

export default function Settings() {
  const { data, update, replace } = useStore();
  const s = data.settings;
  const [loc, setLoc] = useState("");
  const [msg, setMsg] = useState("");
  const [rule, setRule] = useState(s.rule);
  const [resetArm, setResetArm] = useState(false);
  useEffect(() => {
    dataLocation().then(setLoc);
  }, []);
  const sum = rule.needs + rule.wants + rule.savings;

  const exportJson = () =>
    exportBackup(JSON.stringify(data, null, 2), `neonfin-backup-${todayStr()}.json`)
      .then((where) => setMsg(`Бекап збережено: ${where}`))
      .catch((e) => setMsg(`Помилка експорту: ${e}`));

  const importJson = (file: File) => {
    file.text().then((t) => {
      try {
        const d = JSON.parse(t) as Data;
        if (!Array.isArray(d.txs) || !d.settings) throw new Error();
        replace({ ...defaultData(), ...d });
        setMsg(`Імпортовано: ${d.txs.length} операцій.`);
      } catch {
        setMsg("Помилка: це не бекап NEON//FIN.");
      }
    });
  };

  return (
    <div className="grid">
      <Panel title="ТЕМА ОФОРМЛЕННЯ" className="span-12" accent="magenta">
        <div className="themes">
          {THEMES.map((t) => {
            const on = (s.theme || "neon") === t.id;
            return (
              <button key={t.id} className={`theme-card ${on ? "on" : ""}`} onClick={() => update((d) => void (d.settings.theme = t.id))}>
                <div className="theme-prev" style={{ background: t.sw[0] }}>
                  <i style={{ background: t.sw[1] }} />
                  <i style={{ background: t.sw[2], width: "60%" }} />
                  <i style={{ background: t.sw[3], width: "80%" }} />
                </div>
                <div className="theme-name">
                  {on ? "● " : ""}
                  {t.name}
                </div>
                <div className="theme-desc muted">{t.desc}</div>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="ПРАВИЛО РОЗПОДІЛУ ЗП" className="span-6">
        <div className="form-grid three">
          <Field label="Потреби, %">
            <input inputMode="numeric" value={rule.needs} onChange={(e) => setRule({ ...rule, needs: num(e.target.value) })} />
          </Field>
          <Field label="Бажання, %">
            <input inputMode="numeric" value={rule.wants} onChange={(e) => setRule({ ...rule, wants: num(e.target.value) })} />
          </Field>
          <Field label="Майбутнє, %">
            <input inputMode="numeric" value={rule.savings} onChange={(e) => setRule({ ...rule, savings: num(e.target.value) })} />
          </Field>
        </div>
        <div className="row gap">
          <span className={sum === 100 ? "pos" : "neg"}>Сума: {sum}%</span>
          <button className="btn primary sm" disabled={sum !== 100} onClick={() => update((d) => void (d.settings.rule = rule))}>
            Застосувати
          </button>
          <button className="btn ghost sm" onClick={() => setRule({ needs: 50, wants: 30, savings: 20 })}>
            50/30/20
          </button>
          <button className="btn ghost sm" onClick={() => setRule({ needs: 60, wants: 20, savings: 20 })}>
            60/20/20
          </button>
          <button className="btn ghost sm" onClick={() => setRule({ needs: 50, wants: 20, savings: 30 })}>
            50/20/30
          </button>
        </div>
      </Panel>

      <Panel title="ПОДУШКА ТА БАЛАНС" className="span-6">
        <div className="form-grid">
          <Field label="Подушка, місяців витрат">
            <input inputMode="numeric" defaultValue={s.cushionMonths} onBlur={(e) => update((d) => void (d.settings.cushionMonths = Math.max(1, num(e.target.value) || 6)))} />
          </Field>
          <Field label="Стартовий вільний баланс, ₴">
            <input inputMode="decimal" defaultValue={s.startBalance} onBlur={(e) => update((d) => void (d.settings.startBalance = num(e.target.value)))} />
          </Field>
        </div>
        <div className="hint">Стартовий баланс — скільки вільних грошей на картках було до початку обліку. Вільні кошти = старт + доходи − витрати − відкладене.</div>
      </Panel>

      <Panel title="КУРСИ ВАЛЮТ" className="span-6">
        <div className="form-grid three">
          <Field label="USD">
            <input
              inputMode="decimal"
              key={`u${s.rates.USD}`}
              defaultValue={s.rates.USD}
              disabled={!s.rates.manual}
              onBlur={(e) => update((d) => void (d.settings.rates.USD = num(e.target.value) || d.settings.rates.USD))}
            />
          </Field>
          <Field label="EUR">
            <input
              inputMode="decimal"
              key={`e${s.rates.EUR}`}
              defaultValue={s.rates.EUR}
              disabled={!s.rates.manual}
              onBlur={(e) => update((d) => void (d.settings.rates.EUR = num(e.target.value) || d.settings.rates.EUR))}
            />
          </Field>
          <Field label="Джерело">
            <select value={s.rates.manual ? "m" : "nbu"} onChange={(e) => update((d) => void (d.settings.rates.manual = e.target.value === "m"))}>
              <option value="nbu">НБУ (авто)</option>
              <option value="m">Вручну</option>
            </select>
          </Field>
        </div>
        <div className="row gap">
          <span className="muted small">{s.rates.date ? `Оновлено: ${s.rates.date}` : "Ще не оновлювались"}</span>
          {!s.rates.manual && (
            <button
              className="btn ghost sm"
              onClick={() =>
                fetchNbuRates()
                  .then((r) => update((d) => void (d.settings.rates = r)))
                  .then(() => setMsg("Курс НБУ оновлено."))
                  .catch(() => setMsg("Не вдалося отримати курс НБУ (немає інтернету?)."))
              }
            >
              ↻ Оновити зараз
            </button>
          )}
        </div>
      </Panel>

      <Panel title="ДАНІ" className="span-6" accent="magenta">
        <div className="muted small mono">Файл: {loc}</div>
        <div className="muted small">
          Операцій: {data.txs.length} · категорій: {data.categories.length} · сума доходів за весь час: {fmt(data.txs.filter((t) => t.type === "income").reduce((a, t) => a + t.uah, 0))}
        </div>
        <div className="row gap" style={{ marginTop: 12 }}>
          <button className="btn primary sm" onClick={exportJson}>
            ⇩ Експорт JSON
          </button>
          <label className="btn ghost sm">
            ⇧ Імпорт JSON
            <input type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
          </label>
          <button
            className={`btn sm ${resetArm ? "danger" : "ghost"}`}
            onClick={() => {
              if (!resetArm) return setResetArm(true);
              replace(defaultData());
              setResetArm(false);
              setMsg("Усі дані стерто.");
            }}
            onMouseLeave={() => setResetArm(false)}
          >
            {resetArm ? "ТОЧНО СТЕРТИ ВСЕ?" : "Скинути все"}
          </button>
        </div>
        {msg && <div className="hint">{msg}</div>}
      </Panel>
    </div>
  );
}
