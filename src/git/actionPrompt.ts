import { createPrompt, useKeypress, useState } from '@inquirer/core'
import useTerminalSize from './useTerminalSize'

interface GitAction {
  name: string
  key?: string
  value: string
}

// Set your box size here
const ACTION_HEIGHT = 8
const ACTION_WIDTH = 16

const bel = () => process.stdout.write("\x07")

const gitActions = createPrompt((config: { actions: GitAction[], keys?: 'number' | 'letter' }, done) => {
  const [position, setPosition] = useState([0, 0])

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

  useKeypress((key) => {
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
      const action = grid[position[0]][position[1]]
      if (action) {
        done(action.value)
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
  })

  let output = ''

  for (let r = 0; r < rows; r++) {
    // Prepare all boxes for this row
    const boxes: string[][] = []
    for (let c = 0; c < cols; c++) {
      const action = grid[r][c]
      const isSelected = r === position[0] && c === position[1]
      boxes.push(renderActionBox(action, isSelected, ACTION_WIDTH, ACTION_HEIGHT))
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

  output += '\nUse arrow keys to navigate and Enter or the action key to select.'

  return output
})

export default gitActions;
function renderActionBox(
  action: GitAction | undefined,
  isSelected: boolean,
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

  // Highlight if selected
  if (isSelected) {
    for (let i = 0; i < height; i++) {
      lines[i] = lines[i].replace(/./g, (ch: string) => `\x1b[7m${ch}\x1b[0m`)
    }
  }

  return lines
}