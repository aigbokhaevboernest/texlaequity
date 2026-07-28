/**
 * Fixes a well-known crash: "NotFoundError: The object can not be found here."
 *
 * Cause: Google's Website Translator widget rewrites text nodes directly in
 * the DOM. React doesn't know this happened, so when it later tries to
 * remove or reposition one of those nodes during its own re-render, the
 * browser throws because the node structure no longer matches what React
 * expects. This crashes the whole app (you see "Something went wrong").
 *
 * Fix: make removeChild/insertBefore fail silently instead of throwing when
 * the node isn't actually where React thinks it is. This is the standard
 * workaround used across the React + Google Translate community.
 *
 * IMPORTANT: import this file ONCE, as early as possible — the very top of
 * src/main.tsx, before ReactDOM.createRoot(...).render(...) — so the patch
 * is in place before React or Google's script ever touch the DOM.
 *
 *   // src/main.tsx
 *   import "./lib/google-translate-dom-patch";   // <-- add this line first
 *   import { createRoot } from "react-dom/client";
 *   ...
 */

if (typeof Node === "function" && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  // @ts-expect-error - intentionally patching a built-in for a known DOM/React conflict
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      // The node Google Translate moved is no longer where React expects it —
      // skip the removal instead of throwing.
      return child;
    }
    return originalRemoveChild.apply(this, [child]) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  // @ts-expect-error - intentionally patching a built-in for a known DOM/React conflict
  Node.prototype.insertBefore = function <T extends Node>(
    newNode: T,
    referenceNode: Node | null
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode;
    }
    return originalInsertBefore.apply(this, [newNode, referenceNode]) as T;
  };
}
