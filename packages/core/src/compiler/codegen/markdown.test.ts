/**
 * MIT License
 *
 * Copyright (c) 2023–Present PPResume (https://ppresume.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

import { describe, expect, it } from 'vitest'

import type {
  BulletListNode,
  DocNode,
  ListItemNode,
  Mark,
  OrderedListNode,
  ParagraphNode,
  TextNode,
} from '@/compiler/ast'
import { nodeToMarkdown } from './markdown'

describe(nodeToMarkdown, () => {
  describe('bulletListNodeToMarkdown', () => {
    it('should return an empty string with no items', () => {
      const node: BulletListNode = {
        content: [],
        type: 'bulletList',
      }

      expect(nodeToMarkdown(node)).toBe('')
    })

    it('should return a bullet list with one item', () => {
      const emptyParagraphNode: ParagraphNode = {
        content: [],
        type: 'paragraph',
      }

      const listItemNode: ListItemNode = {
        content: [emptyParagraphNode],
        type: 'listItem',
      }

      const node: BulletListNode = {
        content: [listItemNode],
        type: 'bulletList',
      }

      expect(nodeToMarkdown(node)).toBe('- \n')
    })

    it('should return bullet list with multiple items', () => {
      const hello = 'Hello, '
      const world = 'world!'

      const helloParagraphNode: ParagraphNode = {
        content: [
          {
            text: hello,
            type: 'text',
          },
        ],
        type: 'paragraph',
      }

      const worldParagraphNode: ParagraphNode = {
        content: [
          {
            text: world,
            type: 'text',
          },
        ],
        type: 'paragraph',
      }

      const helloListItemNode: ListItemNode = {
        content: [helloParagraphNode],
        type: 'listItem',
      }

      const worldListItemNode: ListItemNode = {
        content: [worldParagraphNode],
        type: 'listItem',
      }

      const node: BulletListNode = {
        content: [helloListItemNode, worldListItemNode],
        type: 'bulletList',
      }

      expect(nodeToMarkdown(node)).toBe(`- ${hello}\n- ${world}\n`)
    })

    it('should handle nested bullet lists', () => {
      const innerListItem: ListItemNode = {
        content: [
          {
            content: [{ text: 'Nested item', type: 'text' }],
            type: 'paragraph',
          },
        ],
        type: 'listItem',
      }

      const innerList: BulletListNode = {
        content: [innerListItem],
        type: 'bulletList',
      }

      const outerListItem: ListItemNode = {
        content: [
          {
            content: [{ text: 'Outer item', type: 'text' }],
            type: 'paragraph',
          },
          innerList,
        ],
        type: 'listItem',
      }

      const node: BulletListNode = {
        content: [outerListItem],
        type: 'bulletList',
      }

      expect(nodeToMarkdown(node)).toBe('- Outer item\n\n- Nested item\n')
    })
  })

  describe('docNodeToMarkdown', () => {
    it('should return empty string with no content', () => {
      const tests: DocNode[] = [
        {
          type: 'doc',
        },
        {
          content: [],
          type: 'doc',
        },
      ]

      for (const node of tests) {
        expect(nodeToMarkdown(node)).toBe('')
      }
    })

    it('should return proper string with some content', () => {
      const hello = 'Hello, '
      const world = 'world!'

      const helloParagraphNode: ParagraphNode = {
        content: [
          {
            text: hello,
            type: 'text',
          },
        ],
        type: 'paragraph',
      }

      const worldParagraphNode: ParagraphNode = {
        content: [
          {
            text: world,
            type: 'text',
          },
        ],
        type: 'paragraph',
      }

      const node: DocNode = {
        content: [helloParagraphNode, worldParagraphNode],
        type: 'doc',
      }

      expect(nodeToMarkdown(node)).toBe(`${hello}\n\n${world}\n\n`)
    })
  })

  describe('listItemNodeToMarkdown', () => {
    it('should return empty item with empty string', () => {
      const emptyParagraphNode: ParagraphNode = {
        content: [],
        type: 'paragraph',
      }

      const node: ListItemNode = {
        content: [emptyParagraphNode],
        type: 'listItem',
      }

      expect(nodeToMarkdown(node)).toBe('- \n')
    })

    it('should return an item with non-empty paragraph', () => {
      const paragraphNode: ParagraphNode = {
        type: 'paragraph',
        content: [
          {
            text: 'Hello, ',
            type: 'text',
          },
          {
            text: 'world!',
            type: 'text',
          },
        ],
      }

      const node: ListItemNode = {
        content: [paragraphNode],
        type: 'listItem',
      }

      expect(nodeToMarkdown(node)).toBe('- Hello, world!\n')
    })
  })

  describe('orderedListNodeToMarkdown', () => {
    it('should return an empty string with no items', () => {
      const node: OrderedListNode = {
        content: [],
        type: 'orderedList',
      }

      expect(nodeToMarkdown(node)).toBe('')
    })

    it('should return an ordered list with one item', () => {
      const emptyParagraphNode: ParagraphNode = {
        content: [],
        type: 'paragraph',
      }

      const listItemNode: ListItemNode = {
        content: [emptyParagraphNode],
        type: 'listItem',
      }

      const node: OrderedListNode = {
        content: [listItemNode],
        type: 'orderedList',
      }

      expect(nodeToMarkdown(node)).toBe('1. \n')
    })

    it('should return ordered list with multiple items', () => {
      const hello = 'Hello, '
      const world = 'world!'

      const helloParagraphNode: ParagraphNode = {
        content: [
          {
            text: hello,
            type: 'text',
          },
        ],
        type: 'paragraph',
      }

      const worldParagraphNode: ParagraphNode = {
        content: [
          {
            text: world,
            type: 'text',
          },
        ],
        type: 'paragraph',
      }

      const helloListItemNode: ListItemNode = {
        content: [helloParagraphNode],
        type: 'listItem',
      }

      const worldListItemNode: ListItemNode = {
        content: [worldParagraphNode],
        type: 'listItem',
      }

      const node: OrderedListNode = {
        content: [helloListItemNode, worldListItemNode],
        type: 'orderedList',
      }

      expect(nodeToMarkdown(node)).toBe(`1. ${hello}\n2. ${world}\n`)
    })

    it('should respect custom start number', () => {
      const paragraphNode: ParagraphNode = {
        content: [{ text: 'Item', type: 'text' }],
        type: 'paragraph',
      }

      const listItemNode: ListItemNode = {
        content: [paragraphNode],
        type: 'listItem',
      }

      const node: OrderedListNode = {
        content: [listItemNode, listItemNode],
        type: 'orderedList',
        attrs: { start: 5 },
      }

      expect(nodeToMarkdown(node)).toBe('5. Item\n6. Item\n')
    })
  })

  describe('paragraphNodeToMarkdown', () => {
    it('should return string with only one newline with no content', () => {
      const tests: ParagraphNode[] = [
        {
          type: 'paragraph',
        },
        {
          content: [],
          type: 'paragraph',
        },
      ]

      for (const node of tests) {
        expect(nodeToMarkdown(node)).toBe('\n')
      }
    })

    it('should return plain text with no marks', () => {
      const node: ParagraphNode = {
        type: 'paragraph',
        content: [
          {
            text: 'Hello, ',
            type: 'text',
          },
          {
            text: 'world!',
            type: 'text',
          },
        ],
      }

      expect(nodeToMarkdown(node)).toBe('Hello, world!\n\n')
    })

    it('should return marked text with some marks', () => {
      const node: ParagraphNode = {
        type: 'paragraph',
        content: [
          {
            marks: [{ type: 'bold' }, { type: 'italic' }],
            text: 'Hello',
            type: 'text',
          },
          {
            text: ', ',
            type: 'text',
          },
          {
            marks: [{ type: 'bold' }],
            text: 'world!',
            type: 'text',
          },
        ],
      }

      expect(nodeToMarkdown(node)).toBe('***Hello***, **world!**\n\n')
    })
  })

  describe('textNodeToMarkdown', () => {
    const text = 'Hello, world!'
    const url = 'https://example.com'

    it('should return plain text with no marks', () => {
      const node: TextNode = {
        text: text,
        type: 'text',
      }

      expect(nodeToMarkdown(node)).toBe('Hello, world!')
    })

    it('should return plain text with one mark', () => {
      const tests: { marks: Mark[]; expected: string }[] = [
        {
          marks: [{ type: 'bold' }],
          expected: `**${text}**`,
        },
        {
          marks: [{ type: 'italic' }],
          expected: `*${text}*`,
        },
        {
          marks: [
            {
              type: 'link',
              attrs: { href: url, class: '', target: '' },
            },
          ],
          expected: `[${text}](${url})`,
        },
      ]

      for (const { marks, expected } of tests) {
        const node: TextNode = {
          marks,
          text,
          type: 'text',
        }

        expect(nodeToMarkdown(node)).toBe(expected)
      }
    })

    it('should return plain text with multiple marks', () => {
      const tests: { marks: Mark[]; expected: string }[] = [
        {
          marks: [{ type: 'bold' }, { type: 'italic' }],
          expected: `***${text}***`,
        },
        {
          marks: [{ type: 'italic' }, { type: 'bold' }],
          expected: `**\*${text}\***`,
        },
        {
          marks: [
            {
              type: 'link',
              attrs: { href: url, class: '', target: '' },
            },
            { type: 'bold' },
          ],
          expected: `**[${text}](${url})**`,
        },
      ]

      for (const { marks, expected } of tests) {
        const node: TextNode = {
          marks,
          text,
          type: 'text',
        }

        expect(nodeToMarkdown(node)).toBe(expected)
      }
    })

    it('should handle link with missing href', () => {
      const node: TextNode = {
        marks: [
          {
            type: 'link',
            attrs: undefined,
          },
        ],
        text,
        type: 'text',
      }

      expect(nodeToMarkdown(node)).toBe(`[${text}]()`)
    })
  })
})
