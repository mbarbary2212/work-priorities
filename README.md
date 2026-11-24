# Work Priorities

A small panel for Claude Code called **My priorities**. It sits beside the chat and lists the things you still have to do, each with its next step, so you do not lose track when you work across many sessions and projects.

## What it does

- Items you have a step to do come first. Items that are parked or waiting for something are marked **(waiting)**.
- Each item shows its project, a short title and the next step in one plain sentence.
- Each item can show a **Where** line: the session, website or app where the work lives.
- Each item has a **Done** button that removes it. To park an item or bring it back, tell Claude.
- The list is shared by all your sessions. A change made in one session shows in the others after your next message there.
- The list starts empty.

## How to use it

- Add an item: tell Claude "remind me to ...".
- Finish an item: press **Done**, or tell Claude "mark this done".
- Ask what is open: tell Claude "what am I working on?".
- Show the panel again: click the **My priorities** button above the message box (it also counts the items you have a step to do), or type `/work`.

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
