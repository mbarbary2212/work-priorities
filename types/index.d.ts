export type ReminderColor = 'red' | 'yellow'

export type Reminder = {
  id: number
  color: ReminderColor
  project: string
  title: string
  next: string
  /** Where the work lives: a session title, a website, an app. */
  where?: string
}

declare module 'claude-code' {
  interface PluginState {
    'work-priorities': { items: Shaped<Reminder[]> }
  }
}
