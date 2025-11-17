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

import fs from 'node:fs'
import path from 'node:path'
import {
  getResumeRenderer,
  joinNonEmptyString,
  type OutputFormat,
  type Resume,
  toCodeBlock,
  YAMLResumeError,
} from '@yamlresume/core'
import { Command } from 'commander'
import { consola } from 'consola'
import { execa } from 'execa'
import which from 'which'

import { readResume } from './validate'

/**
 * Infer the output file name from the source file name
 *
 * For now we support yaml, yml and json file extensions, and the output file
 * will have a `.tex` or `.md` extension based on the format.
 *
 * @param resumePath - The source resume file
 * @param format - The output format ('latex' or 'markdown')
 * @param outputDir - Optional output directory to place the file in
 * @returns The output file name
 * @throws {Error} If the source file has an unsupported extension.
 */
export function inferOutput(
  resumePath: string,
  format: OutputFormat,
  outputDir?: string
): string {
  const extname = path.extname(resumePath)

  if (
    resumePath.endsWith('.yaml') ||
    resumePath.endsWith('.yml') ||
    resumePath.endsWith('.json')
  ) {
    const outputExt = format === 'markdown' ? '.md' : '.tex'
    const baseName = path.basename(
      resumePath.replace(/\.yaml|\.yml|\.json$/, outputExt)
    )
    if (outputDir) {
      return path.join(outputDir, baseName)
    }
    return resumePath.replace(/\.yaml|\.yml|\.json$/, outputExt)
  }

  throw new YAMLResumeError('INVALID_EXTNAME', { extname })
}

/**
 * Get the PDF output path from a tex file path
 *
 * @param texPath - The tex file path
 * @returns The PDF file path
 */
export function getPdfPath(texPath: string): string {
  return texPath.replace(/\.tex$/, '.pdf')
}

type LaTeXEnvironment = 'xelatex' | 'tectonic'

/**
 * Check if a command is available
 *
 * @param command - The command to check
 * @returns True if the command is available, false otherwise
 */
export function isCommandAvailable(command: string): boolean {
  try {
    return !!which.sync(command)
  } catch {
    return false
  }
}

/**
 * Infer the LaTeX environment to use
 *
 * We support xelatex and tectonic, if both are installed we will prioritize
 * xelatex.
 *
 * @returns The LaTeX environment PATH.
 * @throws {Error} If neither 'xelatex' nor 'tectonic' is found in system PATH.
 */
export function inferLaTeXEnvironment(): LaTeXEnvironment {
  if (isCommandAvailable('xelatex')) {
    return 'xelatex'
  }

  if (isCommandAvailable('tectonic')) {
    return 'tectonic'
  }

  throw new YAMLResumeError('LATEX_NOT_FOUND', {})
}

/**
 * Infer the LaTeX command to use based on the LaTeX environment
 *
 * @param resumePath - The source resume file
 * @param outputDir - Optional output directory for the generated tex file
 * @returns The LaTeX command
 * @throws {Error} If the LaTeX environment cannot be inferred or the source
 * file extension is unsupported.
 */
export function inferLaTeXCommand(
  resumePath: string,
  outputDir?: string
): { command: string; args: string[]; cwd: string } {
  const environment = inferLaTeXEnvironment()
  const texFile = inferOutput(resumePath, 'latex', outputDir)

  let command = ''
  let args: string[] = []

  switch (environment) {
    case 'xelatex':
      command = 'xelatex'
      args = ['-halt-on-error', path.basename(texFile)]
      break
    case 'tectonic':
      command = 'tectonic'
      args = [path.basename(texFile)]
      break
  }

  const cwd = outputDir
    ? path.resolve(outputDir)
    : path.dirname(path.resolve(texFile))

  return { command, args, cwd }
}

/**
 * Compiles the resume source file to the specified output format.
 *
 * @param resumePath - The source resume file path (YAML, YML, or JSON).
 * @param resume - The parsed resume object.
 * @param format - The output format ('latex' or 'markdown').
 * @param outputDir - Optional output directory for the generated file.
 * @remarks This function performs file I/O: writes a .tex or .md file.
 * @throws {Error} Can throw if rendering or writing fails.
 */
export function generateTeX(
  resumePath: string,
  resume: Resume,
  format: OutputFormat,
  outputDir?: string
) {
  // make sure the file has an valid extension, i.e, '.json', '.yml' or '.yaml'
  const outputFile = inferOutput(resumePath, format, outputDir)

  // Create output directory if it doesn't exist
  if (outputDir && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const renderer = getResumeRenderer(resume, undefined, format)
  const output = renderer.render()

  try {
    fs.writeFileSync(outputFile, output)
  } catch (_error) {
    throw new YAMLResumeError('FILE_WRITE_ERROR', { path: outputFile })
  }
}

/**
 * Build a YAML resume to the specified output format
 *
 * It first validates the resume against the schema (unless `--no-validate` flag
 * is used), then generates the output file (using `generateTeX`) and optionally
 * runs the inferred LaTeX command (e.g., xelatex or tectonic) to produce the PDF
 * when format is 'latex'.
 *
 * Steps:
 * 1. read the resume from the source file
 * 2. validate the resume against YAMLResume schema (unless `--no-validate`)
 * 3. generate the output file based on format
 * 4. if format is latex and pdf is true, compile to PDF
 *
 * @param resumePath - The source resume file path (YAML, YML, or JSON).
 * @param options - Build options including format, validation, PDF generation flags, and output directory.
 * @remarks This function performs file I/O (via `generateTeX`) and executes an
 * external process (LaTeX compiler) when format is 'latex'.
 * @throws {Error} Can throw if output generation, LaTeX command inference, or the
 * LaTeX compilation process fails.
 */
export async function buildResume(
  resumePath: string,
  options: {
    pdf?: boolean
    validate?: boolean
    output?: string
    format?: OutputFormat
  } = {
    pdf: true,
    validate: true,
    format: 'latex',
  }
) {
  const format = options.format || 'latex'

  // Validate format option
  if (format !== 'latex' && format !== 'markdown') {
    throw new YAMLResumeError('INVALID_FORMAT', { format })
  }

  const { resume } = readResume(resumePath, options.validate)

  // Generate output file (in output directory if specified, current directory otherwise)
  generateTeX(resumePath, resume, format, options.output)

  // Skip PDF generation for markdown format
  if (format === 'markdown') {
    consola.success('Generated resume markdown file successfully.')
    return
  }

  if (!options.pdf) {
    consola.success('Generated resume TeX file successfully.')
    return
  }

  // Generate PDF using LaTeX
  const { command, args, cwd } = inferLaTeXCommand(resumePath, options.output)

  consola.start(
    `Generating resume PDF file with command: \`${command} ${args.join(' ')}\`...`
  )

  try {
    // Use execa with cwd parameter to run LaTeX command in the correct directory
    const result = await execa(command, args, {
      cwd,
      encoding: 'utf8',
    })
    consola.success('Generated resume PDF file successfully.')
    consola.debug(joinNonEmptyString(['stdout: ', toCodeBlock(result.stdout)]))
  } catch (error) {
    consola.debug(joinNonEmptyString(['stdout: ', toCodeBlock(error.stdout)]))
    consola.debug(joinNonEmptyString(['stderr: ', toCodeBlock(error.stderr)]))
    throw new YAMLResumeError('LATEX_COMPILE_ERROR', { error: error.message })
  }
}

/**
 * Create a command instance to build a YAML resume to the specified output format
 */
export function createBuildCommand() {
  return new Command()
    .name('build')
    .description('build a resume to LaTeX and PDF')
    .argument('<resume-path>', 'the resume file path')
    .option('--no-pdf', 'only generate TeX file without PDF')
    .option('--no-validate', 'skip resume schema validation')
    .option('-o, --output <dir>', 'output directory for generated files')
    .option(
      '-f, --format <format>',
      'output format (latex or markdown)',
      'latex'
    )
    .action(
      async (
        resumePath: string,
        options: {
          pdf: boolean
          validate: boolean
          output?: string
          format: OutputFormat
        }
      ) => {
        try {
          await buildResume(resumePath, options)
        } catch (error) {
          consola.error(error.message)
          process.exit(error.errno)
        }
      }
    )
}
