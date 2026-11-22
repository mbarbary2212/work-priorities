import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'work-priorities',
  component: 'Pane',
  requestId: 'work-priorities',
  props: {
    title: 'My priorities',
    isFocused: false,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

const TOOL = 'mcp__work-priorities__remind'

test('the pane starts empty and the tool adds, updates and removes items', async ($, on) => {
  let saved: unknown
  on('command.register', () => ({ value: { command: 'work' } }))
  on('tool.register', () => ({ value: { tool: TOOL } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('store.get', () => ({ value: saved }))
  on('store.set', (_, e) => {
    saved = e.value

    return { value: undefined }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const empty = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await empty.find({ type: 'Text', text: /need you/ }))?.text).toBe('🔴 0 need you, 🟡 0 parked')
  expect(await empty.find({ type: 'Text', text: /Everything is done/ })).toBeTruthy()
  await empty.unmount()

  const added = await $.tool.call({
    tool: TOOL,
    action: 'add',
    project: 'Garden',
    title: 'Water the plants',
    next: 'Fill the watering can.',
  })
  expect(added.result).toBe('Added 🔴 #1 Garden: Water the plants.')

  const parked = await $.tool.call({ tool: TOOL, action: 'update', id: 1, color: 'yellow' })
  expect(parked.result).toBe('Updated 🟡 #1 Garden: Water the plants.')

  const shown = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await shown.find({ type: 'Text', text: /need you/ }))?.text).toBe('🔴 0 need you, 🟡 1 parked')
  expect(await shown.find({ type: 'Text', text: /Water the plants/ })).toBeTruthy()
  await shown.unmount()

  const done = await $.tool.call({ tool: TOOL, action: 'done', id: 1 })
  expect(done.result).toBe('Done and removed: #1 Garden: Water the plants.')
})
