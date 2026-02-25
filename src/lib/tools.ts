// Tool definitions (Groq function-calling schema) + execution logic
import { webSearch } from './search'
import { runCalculation, type CalcType } from './calculations'
import type { ProjectContext } from '../types'

// ─── Groq tool schemas ────────────────────────────────────────────────────────
export const TOOL_DEFINITIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'web_search',
      description:
        'Search the web for architecture information: building precedents, case studies, materials, structural systems, climate strategies, historical movements, building regulations, famous architects and their projects. ' +
        'Use this whenever the student asks about specific buildings, architects, typologies, or needs up-to-date reference material.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'Specific, architecture-focused search query. E.g. "Kengo Kuma wood architecture precedents", "passive cooling strategies hot-arid climate", "hospital atrium typology examples".',
          },
          source: {
            type: 'string',
            enum: ['web', 'wikipedia'],
            description:
              'Use "wikipedia" for historical/conceptual research (movements, typologies, historical figures). Use "web" for specific recent buildings or broader searches.',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'architecture_calculate',
      description:
        'Perform architecture-specific technical calculations. Use this whenever the student needs sizing, dimensions, area requirements, or code-compliance checks.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: [
              'elevator',
              'staircase',
              'ramp',
              'parking',
              'far',
              'daylight',
              'structural_bay',
              'acoustic',
              'accessible_dimensions',
              'program_area',
            ],
            description:
              'Calculation type. elevator=lift sizing; staircase=riser/going; ramp=slope/run; parking=spaces/area; far=floor-area-ratio; daylight=window area; structural_bay=beam depth; acoustic=RT60; accessible_dimensions=ADA reference; program_area=space list totals.',
          },
          params: {
            type: 'object',
            description:
              'Parameters for the calculation. ' +
              'elevator: {floors, occupancy_per_floor, building_type("office"|"residential"|"hotel"|"hospital"|"retail")}. ' +
              'staircase: {total_rise_mm, riser_mm?, building_type?("residential"|"public"|"escape")}. ' +
              'ramp: {height_mm, use?("accessible"|"vehicle"|"service")}. ' +
              'parking: {gfa_sqm, building_type("office"|"residential"|"retail"|"hotel"|"mixed"), units?}. ' +
              'far: {site_area_sqm, gfa_sqm?, footprint_sqm?, target_far?}. ' +
              'daylight: {floor_area_sqm, ceiling_height_m, room_depth_m, glazing_type?("clear"|"tinted"|"low-e")}. ' +
              'structural_bay: {span_m, system("steel_beam"|"concrete_flat_slab"|"concrete_beam"|"timber"), load_type?}. ' +
              'acoustic: {volume_m3, room_type("office"|"classroom"|"concert_hall"|"restaurant"|"recording_studio"|"church"|"sports_hall")}. ' +
              'accessible_dimensions: {} (no params needed — returns full reference). ' +
              'program_area: {spaces:[{name, area_sqm, quantity?}], efficiency_factor?}.',
          },
        },
        required: ['type', 'params'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_project_context',
      description:
        'Save important information about the student\'s project to shared memory. ' +
        'This memory is available across ALL modes — the student will not need to repeat themselves when switching modes. ' +
        'Call this whenever you learn something significant: typology, site, client, stage, concept, key decisions, main challenges, or the full project summary. ' +
        'In Plan Mode, always call this after the student confirms their Project Summary Card.',
      parameters: {
        type: 'object',
        properties: {
          updates: {
            type: 'object',
            description:
              'Key-value pairs to save. Common keys: typology, scale, site, client, stage, decisions, challenges, deadline, concept, summary. ' +
              'You can also use custom keys like "structural_system" or "key_constraint".',
            additionalProperties: { type: 'string' },
          },
        },
        required: ['updates'],
      },
    },
  },
] as const

// ─── Tool execution ───────────────────────────────────────────────────────────
export interface ToolCallResult {
  output: string
  contextUpdates?: Partial<ProjectContext>
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  _ctx: ProjectContext
): Promise<ToolCallResult> {
  switch (name) {
    case 'web_search': {
      const query = args.query as string
      const source = (args.source as 'web' | 'wikipedia') ?? 'web'
      const result = await webSearch(query, source)
      return { output: result }
    }

    case 'architecture_calculate': {
      const type = args.type as CalcType
      const params = (args.params as Record<string, unknown>) ?? {}
      const result = runCalculation(type, params)
      const formatted = formatCalcResult(result)
      return { output: formatted }
    }

    case 'update_project_context': {
      const updates = args.updates as Partial<ProjectContext>
      return {
        output: `Project context updated: ${Object.keys(updates).join(', ')}.`,
        contextUpdates: updates,
      }
    }

    default:
      return { output: `Unknown tool: ${name}` }
  }
}

function formatCalcResult(r: ReturnType<typeof runCalculation>): string {
  const lines = [`**${r.title}**`, `${r.summary}`, '']

  for (const d of r.details) {
    if (d.label === '─────') {
      lines.push('---')
    } else {
      lines.push(`- **${d.label}:** ${d.value}${d.note ? ` *(${d.note})*` : ''}`)
    }
  }

  if (r.warnings && r.warnings.length > 0) {
    lines.push('', '**⚠ Notes:**')
    for (const w of r.warnings) lines.push(`- ${w}`)
  }

  if (r.reference) {
    lines.push('', `*Reference: ${r.reference}*`)
  }

  return lines.join('\n')
}
