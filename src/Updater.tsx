import { useEffect, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { Modal } from "./ui";

const isTauri = () => "__TAURI_INTERNALS__" in window;

/** Checks GitHub Releases on startup and offers to install a newer version. */
export function Updater() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isTauri()) return;
    check()
      .then((u) => u && setUpdate(u))
      .catch((e) => console.warn("update check failed", e));
  }, []);

  if (!update) return null;

  const install = async () => {
    setError("");
    setProgress(0);
    let total = 0;
    let got = 0;
    try {
      await update.downloadAndInstall((ev) => {
        if (ev.event === "Started") total = ev.data.contentLength ?? 0;
        else if (ev.event === "Progress") {
          got += ev.data.chunkLength;
          setProgress(total ? got / total : 0);
        } else if (ev.event === "Finished") setProgress(1);
      });
      await relaunch();
    } catch (e) {
      setProgress(null);
      setError(String(e));
    }
  };

  const busy = progress !== null;

  return (
    <Modal title="Доступне оновлення" onClose={() => !busy && setUpdate(null)}>
      <div className="split-total">
        Нова версія <b>v{update.version}</b> <span className="muted">(зараз v{update.currentVersion})</span>
      </div>
      {update.body && <pre className="update-notes">{update.body}</pre>}
      {busy && (
        <div className="bar" style={{ marginTop: 14 }}>
          <div className="bar-fill tone-green" style={{ width: `${Math.round((progress ?? 0) * 100)}%` }} />
        </div>
      )}
      {busy && <div className="hint">Завантаження… програма перезапуститься сама. Дані не зачіпаються.</div>}
      {error && <div className="hint neg">Помилка: {error}</div>}
      <div className="modal-actions">
        <button className="btn ghost" onClick={() => setUpdate(null)} disabled={busy}>
          Пізніше
        </button>
        <button className="btn green" onClick={install} disabled={busy}>
          {busy ? `${Math.round((progress ?? 0) * 100)}%` : "Оновити"}
        </button>
      </div>
    </Modal>
  );
}
