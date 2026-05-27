import { useTranslation } from 'react-i18next'

export function StrangeReminderApp() {
  const { t } = useTranslation()

  return (
    <div className="flex h-full flex-col bg-background p-4">
      <h1 className="text-sm font-semibold">
        {t('modules.strangeReminder.title')}
      </h1>
    </div>
  )
}
