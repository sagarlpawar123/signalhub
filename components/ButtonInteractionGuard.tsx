"use client";

import { useEffect, type ReactNode } from "react";
import { toast } from "@/components/ui/toast";

export const BUTTON_INTERACTION_LOCK_MS = 450;
export const BUTTON_ACTION_TIMEOUT_MS = 15_000;

type BusyMode = "interaction" | "loading" | "saving";

type ButtonLock = {
  button: HTMLButtonElement;
  form: HTMLFormElement | null;
  mode: BusyMode;
  originalAriaBusy: string | null;
  originalAriaDisabled: string | null;
  originalAriaLabel: string | null;
  originalBusyColor: string;
  originalBusyColorPriority: string;
  startedAt: number;
  submissionStarted: boolean;
  timer: ReturnType<typeof setTimeout>;
};

const SAVING_WORDS = /\b(save|create|add|update|edit|post|schedule|invite|import|upload|apply|confirm|start|enable|disable|pause|resume|rotate|archive|delete|remove|revoke|reset|retry|send|publish|duplicate)\b/i;
const LOADING_WORDS = /\b(load|open|view|preview|test|run|check|continue|sign\s*in|log\s*in|log\s*out|switch|download|export|copy)\b/i;

function buttonText(button: HTMLButtonElement) {
  return (button.getAttribute("aria-label") || button.textContent || "Action")
    .replace(/\s+/g, " ")
    .trim();
}

export function getButtonBusyMode({
  explicitMode,
  isSubmit,
  text,
}: {
  explicitMode?: string;
  isSubmit: boolean;
  text: string;
}): BusyMode {
  if (explicitMode === "interaction" || explicitMode === "loading" || explicitMode === "saving") {
    return explicitMode;
  }
  if (SAVING_WORDS.test(text)) return "saving";
  if (isSubmit || LOADING_WORDS.test(text)) return "loading";
  return "interaction";
}

export function getButtonTimeoutMs(button: HTMLButtonElement, mode: BusyMode) {
  const configured = Number(button.dataset.buttonTimeoutMs);
  if (Number.isFinite(configured) && configured >= BUTTON_INTERACTION_LOCK_MS) return configured;
  return mode === "interaction" ? BUTTON_INTERACTION_LOCK_MS : BUTTON_ACTION_TIMEOUT_MS;
}

function restoreAttribute(element: HTMLElement, name: string, value: string | null) {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

export function ButtonInteractionGuard({ children }: { children: ReactNode }) {
  useEffect(() => {
    const locks = new Map<HTMLButtonElement, ButtonLock>();
    const formLocks = new Map<HTMLFormElement, ButtonLock | null>();

    const release = (lock: ButtonLock) => {
      if (locks.get(lock.button) !== lock) return;
      clearTimeout(lock.timer);
      locks.delete(lock.button);
      if (lock.form && formLocks.get(lock.form) === lock) formLocks.delete(lock.form);
      delete lock.button.dataset.buttonBusy;
      delete lock.button.dataset.buttonGuardLocked;
      restoreAttribute(lock.button, "aria-busy", lock.originalAriaBusy);
      restoreAttribute(lock.button, "aria-disabled", lock.originalAriaDisabled);
      restoreAttribute(lock.button, "aria-label", lock.originalAriaLabel);
      lock.button.style.setProperty(
        "--button-busy-color",
        lock.originalBusyColor,
        lock.originalBusyColorPriority
      );
    };

    const notifyTimeout = (lock: ButtonLock) => {
      // A pending React action may already have committed its mutation. A UI
      // timer cannot cancel it or safely tell the operator to submit again.
      // Managed forms release this lock when their action settles.
      if (lock.form?.dataset.actionPending === "true") return;
      release(lock);
      if (lock.mode === "interaction" || !lock.button.isConnected) return;
      // React-controlled pending buttons can otherwise remain natively disabled
      // forever when their operation never settles. Locks only start on enabled
      // buttons, so returning this property to false restores the initial state.
      lock.button.disabled = false;
      toast(`${buttonText(lock.button)} timed out. Please try again.`, "danger");
    };

    const lockButton = (button: HTMLButtonElement, form: HTMLFormElement | null) => {
      const existing = locks.get(button);
      if (existing) return existing;

      const isSubmit = Boolean(form && button.type === "submit");
      const mode = getButtonBusyMode({
        explicitMode: button.dataset.buttonBusyMode,
        isSubmit,
        text: buttonText(button),
      });
      const timeoutMs = getButtonTimeoutMs(button, mode);
      const computedColor = window.getComputedStyle(button).color;
      const lock = {
        button,
        form,
        mode,
        originalAriaBusy: button.getAttribute("aria-busy"),
        originalAriaDisabled: button.getAttribute("aria-disabled"),
        originalAriaLabel: button.getAttribute("aria-label"),
        originalBusyColor: button.style.getPropertyValue("--button-busy-color"),
        originalBusyColorPriority: button.style.getPropertyPriority("--button-busy-color"),
        startedAt: Date.now(),
        submissionStarted: false,
        timer: 0 as unknown as ReturnType<typeof setTimeout>,
      } satisfies ButtonLock;

      button.dataset.buttonGuardLocked = "true";
      button.dataset.buttonBusy = mode;
      button.setAttribute("aria-busy", mode === "interaction" ? "false" : "true");
      button.setAttribute("aria-disabled", "true");
      if (mode !== "interaction") {
        const progress = mode === "saving" ? "Saving" : "Loading";
        button.setAttribute("aria-label", `${progress}: ${buttonText(button)}`);
        button.style.setProperty("--button-busy-color", computedColor);
      }

      lock.timer = setTimeout(() => notifyTimeout(lock), timeoutMs);
      locks.set(button, lock);
      if (form) formLocks.set(form, lock);
      return lock;
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>("button");
      if (!button || button.dataset.buttonGuard === "off" || button.disabled) return;

      if (locks.has(button)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      const form = button.type === "submit" ? button.form : null;
      const lock = lockButton(button, form);
      queueMicrotask(() => {
        if (event.defaultPrevented && !lock.submissionStarted) release(lock);
      });
    };

    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const existingFormLock = formLocks.get(form);
      const submitter = event.submitter instanceof HTMLButtonElement ? event.submitter : null;

      if (existingFormLock) {
        if (submitter === existingFormLock.button && !existingFormLock.submissionStarted) {
          existingFormLock.submissionStarted = true;
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (formLocks.has(form)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      if (submitter && submitter.dataset.buttonGuard !== "off" && !submitter.disabled) {
        const lock = lockButton(submitter, form);
        lock.submissionStarted = true;
      } else {
        formLocks.set(form, null);
        setTimeout(() => formLocks.delete(form), BUTTON_ACTION_TIMEOUT_MS);
      }
    };

    const onInvalid = (event: Event) => {
      const control = event.target;
      if (!(control instanceof HTMLElement)) return;
      const form = (control as HTMLInputElement).form;
      const lock = form ? formLocks.get(form) : null;
      if (lock) release(lock);
      else if (form) formLocks.delete(form);
    };

    const onReset = (event: Event) => {
      if (!(event.target instanceof HTMLFormElement)) return;
      const lock = formLocks.get(event.target);
      if (lock) release(lock);
      else formLocks.delete(event.target);
    };

    const onActionComplete = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLButtonElement) {
        const lock = locks.get(target);
        if (lock) release(lock);
      } else if (target instanceof HTMLFormElement) {
        const lock = formLocks.get(target);
        if (lock) release(lock);
      }
    };

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type !== "attributes" || record.attributeName !== "disabled") continue;
        const button = record.target;
        if (!(button instanceof HTMLButtonElement) || button.disabled || record.oldValue === null) continue;
        const lock = locks.get(button);
        if (lock) release(lock);
      }
      for (const lock of locks.values()) {
        if (!lock.button.isConnected) release(lock);
      }
    });

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("reset", onReset, true);
    document.addEventListener("signalhub:button-action-complete", onActionComplete, true);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["disabled"],
      attributeOldValue: true,
      childList: true,
      subtree: true,
    });

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("reset", onReset, true);
      document.removeEventListener("signalhub:button-action-complete", onActionComplete, true);
      observer.disconnect();
      for (const lock of locks.values()) clearTimeout(lock.timer);
    };
  }, []);

  return <>{children}</>;
}
