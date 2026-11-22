export type ReminderColor = 'red' | 'yellow'

export type Reminder = {
  id: number
  color: ReminderColor
  project: string
  title: string
  next: string
}

declare module 'claude-code' {
  interface PluginState {
    'work-priorities': { items: Shaped<Reminder[]> }
  }
}
