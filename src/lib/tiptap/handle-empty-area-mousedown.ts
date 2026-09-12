import { Selection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

/**
 * Clicks on empty min-height/padding of a ProseMirror editor focus the view
 * without placing a text selection, so typing does nothing.
 */
export function handleTiptapEmptyAreaMouseDown(view: EditorView, event: MouseEvent): boolean {
  if (event.target !== view.dom) return false;
  const selection = Selection.atEnd(view.state.doc);
  view.dispatch(view.state.tr.setSelection(selection));
  if (!view.hasFocus()) view.focus();
  return true;
}
