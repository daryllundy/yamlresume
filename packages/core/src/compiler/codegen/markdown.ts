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

import type {
  BulletListNode,
  DocNode,
  Fragment,
  ListItemNode,
  Mark,
  Node,
  OrderedListNode,
  ParagraphNode,
  TextNode,
} from '@/compiler/ast'
import type { CodeGenerationContext, CodeGenerator } from './interface'

/**
 * Generate Markdown code from a Node.
 *
 * This class implements the `CodeGenerator` interface and provides a method
 * to convert an AST node into its corresponding Markdown code.
 *
 * @see {@link CodeGenerator}
 */
export class MarkdownCodeGenerator implements CodeGenerator {
  /**
   * Generate Markdown code from an AST node.
   *
   * @param node - The AST node to generate Markdown code from.
   * @param context - Optional context containing layout settings.
   * @returns The generated Markdown code.
   */
  generate(node: Node, context?: CodeGenerationContext): string {
    return nodeToMarkdown(node, context)
  }
}

/**
 * Convert an AST node to its corresponding Markdown code.
 *
 * @param node - The AST node to convert.
 * @param context - Optional context containing layout settings.
 * @returns The generated Markdown code.
 */
export function nodeToMarkdown(
  node: Node,
  context?: CodeGenerationContext
): string {
  switch (node.type) {
    case 'bulletList':
      return bulletListNodeToMarkdown(node, context)
    case 'doc':
      return docNodeToMarkdown(node, context)
    case 'listItem':
      return listItemNodeToMarkdown(node, context)
    case 'orderedList':
      return orderedListNodeToMarkdown(node, context)
    case 'paragraph':
      return paragraphNodeToMarkdown(node, context)
    case 'text':
      return textNodeToMarkdown(node, context)
  }
}

/**
 * Convert a bullet list node to its corresponding Markdown code.
 *
 * @param node - The bullet list node to convert.
 * @param context - Optional context containing layout settings.
 * @returns The generated Markdown code.
 */
function bulletListNodeToMarkdown(
  node: BulletListNode,
  context?: CodeGenerationContext
): string {
  return fragmentToMarkdown(node.content, context)
}

/**
 * Convert a document node to its corresponding Markdown code.
 *
 * @param node - The document node to convert.
 * @param context - Optional context containing layout settings.
 * @returns The generated Markdown code.
 */
function docNodeToMarkdown(
  node: DocNode,
  context?: CodeGenerationContext
): string {
  return fragmentToMarkdown(node.content, context)
}

/**
 * Convert a list item node to its corresponding Markdown code.
 *
 * @param node - The list item node to convert.
 * @param context - Optional context containing layout settings.
 * @returns The generated Markdown code.
 */
function listItemNodeToMarkdown(
  node: ListItemNode,
  context?: CodeGenerationContext
): string {
  const itemContent = fragmentToMarkdown(node.content, context)
  // Remove trailing newlines from the content for cleaner list formatting
  const cleanContent = itemContent.replace(/\n+$/, '')
  return `- ${cleanContent}\n`
}

/**
 * Convert an ordered list node to its corresponding Markdown code.
 *
 * @param node - The ordered list node to convert.
 * @param context - Optional context containing layout settings.
 * @returns The generated Markdown code.
 */
function orderedListNodeToMarkdown(
  node: OrderedListNode,
  context?: CodeGenerationContext
): string {
  const startNumber = node.attrs?.start ?? 1
  let currentNumber = startNumber

  if (node.content === undefined) {
    return ''
  }

  return node.content
    .map((item) => {
      if (item.type === 'listItem') {
        const itemContent = fragmentToMarkdown(item.content, context)
        const cleanContent = itemContent.replace(/\n+$/, '')
        const result = `${currentNumber}. ${cleanContent}\n`
        currentNumber++
        return result
      }
      return ''
    })
    .join('')
}

/**
 * Convert a paragraph node to its corresponding Markdown code.
 *
 * @param node - The paragraph node to convert.
 * @param context - Optional context containing layout settings.
 * @returns The generated Markdown code.
 */
function paragraphNodeToMarkdown(
  node: ParagraphNode,
  context?: CodeGenerationContext
): string {
  if (node.content === undefined || node.content.length === 0) {
    return '\n'
  }

  return `${fragmentToMarkdown(node.content, context)}\n\n`
}

/**
 * Convert a text node to its corresponding Markdown code.
 *
 * @param node - The text node to convert.
 * @param context - Optional context containing layout settings.
 * @returns The generated Markdown code.
 */
function textNodeToMarkdown(
  node: TextNode,
  context?: CodeGenerationContext
): string {
  const text = node.text

  if (node.marks === undefined) {
    return text
  }

  return node.marks.reduce(
    (text, mark) => applyMarkToText(text, mark, context),
    text
  )
}

/**
 * Apply a mark to a text.
 *
 * @param text - The text to apply the mark to.
 * @param mark - The mark to apply.
 * @param context - Optional context containing layout settings.
 */
function applyMarkToText(
  text: string,
  mark: Mark,
  _context?: CodeGenerationContext
) {
  switch (mark.type) {
    case 'bold':
      return `**${text}**`
    case 'italic':
      return `*${text}*`
    case 'link':
      return `[${text}](${mark.attrs?.href ?? ''})`
  }
}

/**
 * Convert a fragment to its corresponding Markdown code.
 *
 * @param fragment - The fragment to convert.
 * @param context - Optional context containing layout settings.
 * @returns The generated Markdown code.
 */
function fragmentToMarkdown(
  fragment: Fragment,
  context?: CodeGenerationContext
): string {
  if (fragment === undefined) {
    return ''
  }
  return fragment.map((node) => nodeToMarkdown(node, context)).join('')
}
