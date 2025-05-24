import { createPrompt, useKeypress, useState } from '@inquirer/core'
import useTerminalSize from './useTerminalSize'
import inquirer from 'inquirer'

interface GitAction {
  name: string
  key?: string
  value: string
  subActions?: GitAction[]
}

// Set your box size here
const ACTION_HEIGHT = 8
const ACTION_WIDTH = 16

const bel = () => process.stdout.write("\x07")

const gitActions = createPrompt((config: { actions: GitAction[], keys?: 'number' | 'letter' }, done) => {
  const [position, setPosition] = useState([0, 0])
  const [selectSubActionIndex, setSelectSubActionIndex] = useState(-1)

  const { width, height } = useTerminalSize()

  // Calculate number of columns and rows based on terminal size and action box size
  const cols = Math.max(1, Math.floor(width / ACTION_WIDTH))
  const rows = Math.ceil(config.actions.length / cols)

  if (config.keys === 'number') {
    config.actions.forEach((action, index) => {
      if (index <= 9) {
        action.key = ((index + 1) % 10).toString()
      }
    })
  } else if (config.keys === 'letter') {
    config.actions.forEach((action, index) => {
      if (index <= 25) {
        action.key = String.fromCharCode(97 + index) // 'a' is 97 in ASCII
      }
    })
  }

  // Build the grid: array of arrays of GitActions
  const grid: GitAction[][] = []
  for (let r = 0; r < rows; r++) {
    const start = r * cols
    const end = start + cols
    grid.push(config.actions.slice(start, end))
  }

  useKeypress(async (key) => {
    if (selectSubActionIndex !== -1) {
      // If a subAction is selected, handle its navigation
      if (key.name === 'up') {
        setSelectSubActionIndex(Math.max(0, selectSubActionIndex - 1))
      }
      else if (key.name === 'down') {
        setSelectSubActionIndex(Math.min(grid[position[0]][position[1]].subActions!.length - 1, selectSubActionIndex + 1))
      }
      //@ts-expect-error meta is not defined in type but exists in the event
      else if (key.name === 'return' && !key.meta) {
        const action = grid[position[0]][position[1]].subActions?.[selectSubActionIndex]
        if (action) {
          done(action.value)
        }
      }
      else if (key.name === 'escape' || key.name === 'backspace') { // Escape is uncomfortable since it is not handled immediately
        setSelectSubActionIndex(-1)
      }
      else {
        const actionWithKey = grid[position[0]][position[1]].subActions?.find(a => a.key && a.key.toLowerCase() === key.name)
        if (actionWithKey) {
          done(actionWithKey.value)
        } else {
          bel()
        }
      }
    } else {
      if (key.name === 'up') {
        setPosition([Math.max(0, position[0] - 1), position[1]])
      }
      else if (key.name === 'down') {
        if (grid[Math.min(grid.length - 1, position[0] + 1)][position[1]]) {
          setPosition([Math.min(grid.length - 1, position[0] + 1), position[1]])
        }
      }
      else if (key.name === 'left') {
        setPosition([position[0], Math.max(0, position[1] - 1)])
      }
      else if (key.name === 'right') {
        setPosition([position[0], Math.min(grid[position[0]].length - 1, position[1] + 1)])
      }
      else if (key.name === 'return') {
        //@ts-expect-error meta is not defined in type but exists in the event
        if (key.meta) {
          if (grid[position[0]][position[1]].subActions) {
            setSelectSubActionIndex(0)
          }
          else {
            bel()
          }
        }
        else {
          const action = grid[position[0]][position[1]]
          if (action) {
            done(action.value)
          }
        }
      }
      else {
        const actionWithKey = config.actions.find(a => a.key && a.key.toLowerCase() === key.name)
        if (actionWithKey) {
          done(actionWithKey.value)
        } else {
          bel()
        }
      }
    }
  })

  let output = ''

  for (let r = 0; r < rows; r++) {
    // Prepare all boxes for this row
    const boxes: string[][] = []
    for (let c = 0; c < cols; c++) {
      const action = grid[r][c]
      const isSelected = r === position[0] && c === position[1]
      boxes.push(renderActionBox(action, isSelected, selectSubActionIndex, ACTION_WIDTH, ACTION_HEIGHT))
    }
    // Render each line of the boxes in this row
    for (let line = 0; line < ACTION_HEIGHT; line++) {
      let rowLine = ''
      for (let c = 0; c < cols; c++) {
        rowLine += boxes[c][line]
      }
      output += rowLine + '\n'
    }
  }

  output += selectSubActionIndex === -1 ? '\nUse arrow keys to navigate and Enter or the action key to select.' : '\nUse arrow keys to select sub action or backspace to exit'

  return output
})

export default gitActions;

function renderActionBox(
  action: GitAction | undefined,
  isSelected: boolean,
  selectSubActionIndex: number = -1,
  width: number,
  height: number
): string[] {
  const lines = Array(height).fill(' '.repeat(width))

  if (!action) {
    // Empty box
    lines[0] = '┌' + '─'.repeat(width - 2) + '┐'
    lines[height - 1] = '└' + '─'.repeat(width - 2) + '┘'
    for (let i = 1; i < height - 1; i++) {
      lines[i] = '│' + ' '.repeat(width - 2) + '│'
    }
    return lines
  }

  // Top and bottom borders
  lines[0] = '┌' + '─'.repeat(width - 2) + '┐'
  lines[height - 1] = '└' + '─'.repeat(width - 2) + '┘'

  // If subActions are being selected, render them as a list
  if (selectSubActionIndex !== -1 && action.subActions && action.subActions.length > 0) {
    const visibleCount = height - 2
    const visibleLength = width - 4 // 2 for borders, 2 for padding
    let start = 0
    // Scroll if needed
    if (selectSubActionIndex >= visibleCount) {
      start = selectSubActionIndex - visibleCount + 1
    }
    const subActionsToShow = action.subActions.slice(start, start + visibleCount)
    // Inverse border
    lines[0] = '\x1b[7m' + lines[0] + '\x1b[0m'
    lines[height - 1] = '\x1b[7m' + lines[height - 1] + '\x1b[0m'
    for (let i = 1; i < height - 1; i++) {
      const subAction = subActionsToShow[i - 1]
      let content = ''
      if (subAction) {
        content = subAction.name.slice(0, visibleLength)
        if (subAction.key) {
          content = `[${subAction.key.toUpperCase()}] ${content.slice(subAction.key.length + 4)}`
        }
        // Reverse: highlight all except the selected subAction
        if (start + i - 1 !== selectSubActionIndex) {
          content = `\x1b[7m${content.padEnd(width - 4)}\x1b[0m`
        } else {
          content = content.padEnd(width - 4)
        }
      } else {
        content = ''.padEnd(width - 4)
        content = `\x1b[7m${content}\x1b[0m`
      }
      if (start + i - 1 === selectSubActionIndex) {
        lines[i] = '\x1b[7m│\x1b[0m ' + content + ' \x1b[7m│\x1b[0m'
      }
      else {
        lines[i] = '\x1b[7m│ \x1b[0m' + content + '\x1b[7m │\x1b[0m'
      }
    }
    return lines
  }

  // Word wrapping with ' ' as separator and 1 space padding on both sides
  const wrapWidth = width - 4 // 2 for borders, 2 for padding
  const words = action.name.split(' ')
  let wrapped: string[] = []
  let currentLine = ''

  for (const word of words) {
    if ((currentLine + (currentLine ? ' ' : '') + word).length > wrapWidth) {
      wrapped.push(currentLine)
      currentLine = word
    } else {
      currentLine += (currentLine ? ' ' : '') + word
    }
  }
  if (currentLine) wrapped.push(currentLine)
  wrapped = wrapped.slice(0, height - 2) // fit in box

  // Fill lines 1..height-2 with wrapped content, centered, padded
  for (let i = 1; i < height - 1; i++) {
    let content = wrapped[i - 1] || ''
    // On the 5th line (i == 4), if action.key, show key centered
    if (i === 4 && action.key) {
      const keyLabel = action.key.toUpperCase()
      const pad = wrapWidth - keyLabel.length
      const padLeft = Math.floor(pad / 2)
      const padRight = pad - padLeft
      content = ' '.repeat(padLeft) + keyLabel + ' '.repeat(padRight)
    } else {
      const pad = wrapWidth - content.length
      const padLeft = Math.floor(pad / 2)
      const padRight = pad - padLeft
      content = ' '.repeat(padLeft) + content + ' '.repeat(padRight)
    }
    lines[i] = '│ ' + content + ' │'
  }

  if (action.subActions) {
    lines[height - 2] = lines[height - 2].slice(0, width - 2) + '*│'
  }

  // Highlight if selected
  if (isSelected) {
    for (let i = 0; i < height; i++) {
      lines[i] = lines[i].replace(/./g, (ch: string) => `\x1b[7m${ch}\x1b[0m`)
    }
  }

  return lines
}