import { describe, expect, it } from 'vitest'
import { highlightMatches } from './highlight.ts'

describe('highlightMatches', () => {
  it('marks the match regardless of case, keeping the original text', () => {
    expect(highlightMatches('Red Lipstick', 'red')).toEqual([
      { text: 'Red', match: true },
      { text: ' Lipstick', match: false },
    ])
  })

  it('marks every occurrence', () => {
    expect(highlightMatches('Pen and pencil', 'pen')).toEqual([
      { text: 'Pen', match: true },
      { text: ' and ', match: false },
      { text: 'pen', match: true },
      { text: 'cil', match: false },
    ])
  })

  it('leaves the text whole without a search or a match', () => {
    expect(highlightMatches('Red Lipstick', undefined)).toEqual([
      { text: 'Red Lipstick', match: false },
    ])
    expect(highlightMatches('Red Lipstick', 'blue')).toEqual([
      { text: 'Red Lipstick', match: false },
    ])
  })

  it('takes special characters literally', () => {
    expect(highlightMatches('Watch (gold)', '(gold)')).toEqual([
      { text: 'Watch ', match: false },
      { text: '(gold)', match: true },
    ])
  })
})
