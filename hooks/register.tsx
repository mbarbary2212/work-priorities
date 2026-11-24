import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Reminder, ReminderColor } from '../types'

const PANE = 'work-priorities'
const TITLE = 'My priorities'
const TOOL = 'mcp__work-priorities__remind'
const STORE_KEY = 'items'

const items = atom({ plugin: 'work-priorities', key: 'items' } as const, [], {
  shape: 'items-1',
})

// A new list starts empty.
const SEED: Reminder[] = []

// Parked items are marked in words, not with coloured dots.
const tag = (one: Reminder): string => (one.color === 'yellow' ? ' (waiting)' : '')

function isReminder(value: unknown): value is Reminder {
  if (typeof value !== 'object' || value === null) return false
  const one = value as Record<string, unknown>

  return (
    typeof one.id === 'number' &&
    (one.color === 'red' || one.color === 'yellow') &&
    typeof one.project === 'string' &&
    typeof one.title === 'string' &&
    typeof one.next === 'string' &&
    (one.where === undefined || typeof one.where === 'string')
  )
}

// The saved list is shared by every session. Read it again so this session
// shows what another session changed.
async function load($: EngineInterface): Promise<Reminder[]> {
  const saved = await $.store.get(STORE_KEY)
  let list: Reminder[]
  if (Array.isArray(saved)) {
    list = saved.filter(isReminder)
  } else {
    list = SEED
    await $.store.set(STORE_KEY, list)
  }
  await update($, items, () => list)

  return list
}

async function save($: EngineInterface, list: Reminder[]): Promise<void> {
  await $.store.set(STORE_KEY, list)
  await update($, items, () => list)
}

function sorted(list: readonly Reminder[]): Reminder[] {
  const rank: Record<ReminderColor, number> = { red: 0, yellow: 1 }

  return [...list].sort((a, b) => rank[a.color] - rank[b.color] || a.id - b.id)
}

function asText(list: readonly Reminder[]): string {
  if (list.length === 0) return 'No open work. Everything is done.'

  return sorted(list)
    .map(
      one =>
        `#${one.id} ${one.project}: ${one.title}${tag(one)}. Next: ${one.next}` +
        (one.where ? ` Where: ${one.where}` : ''),
    )
    .join('\n')
}

type RemindInput = {
  action?: unknown
  id?: unknown
  color?: unknown
  project?: unknown
  title?: unknown
  next?: unknown
  where?: unknown
}

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'work',
      description: 'Show my open work and the next step for each',
    })
    await $.tool.register({
      name: 'remind',
      description:
        "The user's list of priorities (their open work), shown in the \"My priorities\" panel and shared by all their sessions. " +
        'Use it when the user says "remind me to...", "add this to my open work", "mark this done / green", ' +
        '"this is waiting / parked", "change the next step", or asks "what am I working on" or "what is still open". ' +
        'Actions: "list" shows everything. "add" needs project, title and next (the next step, one plain sentence), ' +
        'and color: "red" when the user has a step to do, "yellow" when it is parked or waiting for something. ' +
        '"update" needs id and any of color, project, title, next, where. "done" needs id and removes the item. ' +
        'Always give "where": the place the user goes to do the step, in a few plain words, ' +
        'e.g. the exact title of the Claude session as it shows in the side menu, or a website or app name. ' +
        'Write title and next in plain English with no jargon. Call "list" first when you need an id.',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'add', 'update', 'done'] },
          id: { type: 'number', description: 'The item number shown as #N.' },
          color: { type: 'string', enum: ['red', 'yellow'] },
          project: { type: 'string', description: 'Short project name, e.g. Work, Home, Study.' },
          title: { type: 'string', description: 'A few words naming the work.' },
          next: { type: 'string', description: 'The next step, one plain sentence.' },
          where: {
            type: 'string',
            description:
              'Where the work lives, e.g. Session "Garden: watering plan", or the bank website.',
          },
        },
        required: ['action'],
      },
      isDeferred: false,
    })
    await load($)
    void $.ui.open({ id: PANE, title: TITLE })

    return next(e)
  })

  on('command.run', { command: 'work' }, async $ => {
    const list = await load($)
    await $.ui.open({ id: PANE, title: TITLE })

    return { text: asText(list) }
  })

  // Pick up changes made in other sessions each time the user sends a message.
  on('prompt.submit', async ($, e, next) => {
    // A failed read must never hold back the user's message.
    await load($).catch(() => undefined)

    return next(e)
  })

  on('tool.run', { tool: TOOL }, async ($, e) => {
    const input = e as unknown as RemindInput
    const list = await load($)
    const color: ReminderColor | undefined =
      input.color === 'red' || input.color === 'yellow' ? input.color : undefined
    const id = typeof input.id === 'number' ? input.id : undefined

    if (input.action === 'list') return { result: asText(list) }

    if (input.action === 'add') {
      const project = text(input.project)
      const title = text(input.title)
      const step = text(input.next)
      if (!project || !title || !step) {
        return { deny: 'To add an item, give project, title and next.' }
      }
      const one: Reminder = {
        id: list.reduce((max, item) => Math.max(max, item.id), 0) + 1,
        color: color ?? 'red',
        project,
        title,
        next: step,
        ...(text(input.where) ? { where: text(input.where) } : {}),
      }
      await save($, [...list, one])

      return { result: `Added #${one.id} ${one.project}: ${one.title}.` }
    }

    const found = list.find(item => item.id === id)
    if (!found) {
      return { deny: `No item with that id. The list is:\n${asText(list)}` }
    }

    if (input.action === 'done') {
      await save(
        $,
        list.filter(item => item.id !== found.id),
      )

      return { result: `Done and removed: #${found.id} ${found.project}: ${found.title}.` }
    }

    if (input.action === 'update') {
      const changed: Reminder = {
        ...found,
        color: color ?? found.color,
        project: text(input.project) ?? found.project,
        title: text(input.title) ?? found.title,
        next: text(input.next) ?? found.next,
        ...((text(input.where) ?? found.where) ? { where: text(input.where) ?? found.where } : {}),
      }
      await save(
        $,
        list.map(item => (item.id === found.id ? changed : item)),
      )

      return { result: `Updated #${changed.id} ${changed.project}: ${changed.title}.` }
    }

    return { deny: 'Unknown action. Use list, add, update or done.' }
  })

  // A button above the message box that opens the panel with one click.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    // Reading the list here makes the row draw as soon as the session
    // starts (the list is loaded then), not only after the first message.
    const todo = (await read($, items)).filter(one => one.color === 'red').length
    const { Box, Button } = $.ui.resolve(e)

    return (
      <Box>
        <Button
          key="open-priorities"
          label={todo > 0 ? `${TITLE} (${todo} to do)` : TITLE}
          onPress={async () => {
            await load($).catch(() => undefined)
            // Close first: opening a panel that is already open (but hidden)
            // does not bring it back into view.
            await $.ui.close({ id: PANE }).catch(() => undefined)
            const opened = await $.ui.open({ id: PANE, title: TITLE })
            if (!opened.isPlaced) $.ui.toast(`My priorities could not open: ${opened.reason}`)
          }}
        />
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const list = sorted(await read($, items))

    return (
      <Box flexDirection="column" gap={1}>
        {list.length === 0 && <Text>No open work. Everything is done.</Text>}
        {list.map(one => (
          <Box key={`item-${one.id}`} flexDirection="column">
            <Text bold>
              {one.project}: {one.title}{tag(one)}
            </Text>
            <Text>Next: {one.next}</Text>
            {one.where !== undefined && <Text bold>Where: {one.where}</Text>}
            <Box flexDirection="row" gap={1}>
              <Button
                key={`done-${one.id}`}
                onPress={async () => {
                  const now = await load($)
                  await save(
                    $,
                    now.filter(item => item.id !== one.id),
                  )
                }}
              >
                Done
              </Button>
            </Box>
          </Box>
        ))}
        <Text dimColor>To add one, tell Claude: "remind me to ..."</Text>
      </Box>
    )
  })
}
