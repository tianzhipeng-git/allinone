export const MODULE_SAVE_REQUESTED_EVENT = 'module-save-requested'

export interface ModuleSaveRequestedDetail {
  moduleId: string
}

export function isModuleSaveShortcut(event: KeyboardEvent) {
  return (
    event.key.toLowerCase() === 's' &&
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey
  )
}

export function dispatchModuleSaveRequested(moduleId: string) {
  window.dispatchEvent(
    new CustomEvent<ModuleSaveRequestedDetail>(MODULE_SAVE_REQUESTED_EVENT, {
      detail: { moduleId },
    })
  )
}
