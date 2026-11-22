# Work Priorities

A small panel for Claude Code called **My priorities**. It sits beside the chat and lists the things you still have to do, each with a colour dot and its next step, so you do not lose track when you work across many sessions and projects.

## What it does

- 🔴 red means you have a step to do. 🟡 yellow means the work is parked or waiting for something.
- Each item shows its project, a short title and the next step in one plain sentence.
- Each item has two buttons: **Done** removes it, **Park it** turns red into yellow (and back).
- The list is shared by all your sessions. A change made in one session shows in the others after your next message there.
- The list starts empty.

## How to use it

- Add an item: tell Claude "remind me to ...".
- Finish an item: press **Done**, or tell Claude "mark this done".
- Ask what is open: tell Claude "what am I working on?".
- Show the panel again: type `/work`.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install work-priorities --marketplace mbarbary2212/work-priorities
```

Answer `y` to add the marketplace, then choose a scope.

From a shell:

```
claude plugin install work-priorities --marketplace mbarbary2212/work-priorities
```

## Notes

This mod uses Claude Code's early access plugin interface, which may change between releases. It stores your list on your own computer, in Claude Code's configuration folder. Nothing is sent anywhere.

## License

MIT
