export const QUICK_PANE_SUBMIT_EVENT = 'quick-pane-submit'

export interface QuickPaneOpenModulePayload {
  type: 'open-module'
  moduleId: string
}

export interface QuickPaneModuleItemPayload {
  type: 'module-item'
  moduleId: string
  itemId: string
  query: string
}

export type QuickPaneSubmitPayload =
  | QuickPaneOpenModulePayload
  | QuickPaneModuleItemPayload
