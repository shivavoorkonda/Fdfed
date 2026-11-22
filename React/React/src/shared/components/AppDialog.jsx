import { nanoid } from '@reduxjs/toolkit';
import store from '../../store/index.js';
import { dialogDismissed, dialogQueued, selectActiveDialog } from '../../store/dialogSlice.js';
import { selectWorkspaceVersion } from '../../store/sessionSlice.js';
import "./AppDialog.css";

function renderDialog({ message, confirmation }, finish) {
  const previous = document.activeElement;
  const dialog = document.createElement("dialog");
  dialog.className = "cn-app-dialog";
  const title = document.createElement("h2");
  title.textContent = confirmation ? "Confirm action" : "Information";
  const body = document.createElement("p");
  body.textContent = String(message);
  const actions = document.createElement("div");
  actions.className = "cn-dialog-actions";
  if (confirmation) {
    const cancel = document.createElement("button");
    cancel.textContent = "Cancel";
    cancel.onclick = () => finish(false);
    actions.append(cancel);
  }
  const ok = document.createElement("button");
  ok.className = "cn-dialog-primary";
  ok.textContent = confirmation ? "Confirm" : "OK";
  ok.onclick = () => finish(true);
  actions.append(ok);
  title.id = "cn-dialog-title";
  body.id = "cn-dialog-message";
  dialog.setAttribute("aria-labelledby", title.id);
  dialog.setAttribute("aria-describedby", body.id);
  dialog.append(title, body, actions);
  document.body.append(dialog);
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    finish(false);
  });
  dialog.showModal();
  return () => {
    dialog.close();
    dialog.remove();
    previous?.focus?.();
  };
}

function show(message, confirmation) {
  return new Promise((resolve) => {
    const id = nanoid();
    const version = selectWorkspaceVersion(store.getState());
    let scheduled = false;
    let settled = false;
    let close;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      unsubscribe();
      close?.();
      const sameWorkspace = selectWorkspaceVersion(store.getState()) === version;
      resolve(sameWorkspace && value);
      if (sameWorkspace) store.dispatch(dialogDismissed(id));
    };
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      if (selectWorkspaceVersion(state) !== version) {
        finish(false);
        return;
      }
      const active = selectActiveDialog(state);
      if (scheduled || active?.id !== id) return;
      scheduled = true;
      queueMicrotask(() => {
        if (!settled) close = renderDialog(active, finish);
      });
    });
    store.dispatch(dialogQueued({ id, message: String(message), confirmation }));
  });
}
export const infoDialog = (message) => show(message, false);
export const confirmDialog = (message) => show(message, true);
