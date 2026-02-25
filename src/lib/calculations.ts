// Architecture Calculations Engine
// Based on Neufert Architects' Data, ADA, ISO 21542, CIBSE standards

export type CalcType =
  | 'elevator'
  | 'staircase'
  | 'ramp'
  | 'parking'
  | 'far'
  | 'daylight'
  | 'structural_bay'
  | 'acoustic'
  | 'accessible_dimensions'
  | 'program_area'

export interface CalcResult {
  title: string
  summary: string
  details: { label: string; value: string; note?: string }[]
  warnings?: string[]
  reference?: string
}

// ─── ELEVATOR ────────────────────────────────────────────────────────────────
// Ref: CIBSE Guide D, Neufert 4th ed
interface ElevatorParams {
  floors: number
  occupancy_per_floor: number
  building_type: 'office' | 'residential' | 'hotel' | 'hospital' | 'retail'
}

function calcElevator(p: ElevatorParams): CalcResult {
  const totalOccupancy = p.floors * p.occupancy_per_floor
  // Handling capacity percentages (% of population in 5 min peak)
  const hcPercent =
    p.building_type === 'office' ? 0.12 :
    p.building_type === 'residential' ? 0.05 :
    p.building_type === 'hotel' ? 0.10 :
    p.building_type === 'hospital' ? 0.08 : 0.10

  const targetHC = Math.ceil(totalOccupancy * hcPercent)
  // Assume 10-person (800kg) elevator at 1.0 m/s
  const capacityPerLift = 10
  const avgRoundTripTime = p.floors * 3 + 20 // rough: 3s per floor + door/loading
  const numLifts = Math.ceil((targetHC * avgRoundTripTime) / (5 * 60 * capacityPerLift))
  const recommendedLifts = Math.max(numLifts, p.floors > 4 ? 2 : 1)

  const shaftGuide = [
    { persons: 4, kg: 320, shaft: '1,400 × 1,400 mm', cab: '900 × 1,100 mm' },
    { persons: 6, kg: 480, shaft: '1,800 × 1,500 mm', cab: '1,100 × 1,400 mm' },
    { persons: 8, kg: 630, shaft: '2,000 × 1,700 mm', cab: '1,350 × 1,500 mm' },
    { persons: 10, kg: 800, shaft: '2,100 × 1,900 mm', cab: '1,400 × 1,750 mm' },
    { persons: 13, kg: 1000, shaft: '2,350 × 2,100 mm', cab: '1,700 × 1,900 mm' },
  ]
  const recommended = shaftGuide[3] // 10-person default

  const waitTarget =
    p.building_type === 'office' ? '≤ 30 seconds' :
    p.building_type === 'residential' ? '≤ 60 seconds' : '≤ 45 seconds'

  return {
    title: 'Elevator Sizing',
    summary: `For a ${p.floors}-floor ${p.building_type} with ~${totalOccupancy} occupants, you need approximately ${recommendedLifts} elevator${recommendedLifts > 1 ? 's' : ''}.`,
    details: [
      { label: 'Recommended number of lifts', value: `${recommendedLifts}` },
      { label: 'Recommended capacity', value: '10-person (800 kg)', note: 'Standard for most building types' },
      { label: 'Typical shaft size (10-person)', value: recommended.shaft },
      { label: 'Cab interior (10-person)', value: recommended.cab },
      { label: 'Pit depth', value: '1,000 – 1,500 mm', note: 'Check manufacturer specs' },
      { label: 'Overhead clearance', value: '3,200 – 4,000 mm above top floor' },
      { label: 'Target interval', value: waitTarget },
      { label: 'Accessible requirement', value: 'Min 1,100 × 1,400 mm cab for wheelchair (ISO 4190-1)' },
    ],
    warnings: recommendedLifts === 1 && p.floors > 6 ? ['Single elevator is a code risk for buildings over 6 floors — check local fire egress requirements.'] : [],
    reference: 'CIBSE Guide D: Transportation Systems in Buildings, Neufert 4th Edition',
  }
}

// ─── STAIRCASE ───────────────────────────────────────────────────────────────
// Ref: Neufert, BS 5395, ISO 14122
interface StaircaseParams {
  total_rise_mm: number
  riser_mm?: number          // desired riser height, default 170mm
  building_type?: 'residential' | 'public' | 'escape'
}

function calcStaircase(p: StaircaseParams): CalcResult {
  const targetRiser = p.riser_mm ?? 170
  const numRisers = Math.round(p.total_rise_mm / targetRiser)
  const actualRiser = Math.round(p.total_rise_mm / numRisers)
  // Blondel's rule: 2R + G = 600–640mm
  const going = 630 - 2 * actualRiser
  const totalRun = going * (numRisers - 1) // one landing step at bottom

  const blondelCheck = 2 * actualRiser + going
  const blondelOk = blondelCheck >= 600 && blondelCheck <= 640

  const minWidth =
    p.building_type === 'residential' ? '900 – 1,000 mm' :
    p.building_type === 'escape' ? '≥ 1,800 mm (high occupancy)' : '≥ 1,200 mm'

  const landingEvery = '≤ 3,000 mm vertical rise (every 18 risers at 170mm)'

  return {
    title: 'Staircase Calculator',
    summary: `Total rise of ${p.total_rise_mm} mm → ${numRisers} risers of ${actualRiser} mm each, going ${going} mm.`,
    details: [
      { label: 'Number of risers', value: `${numRisers}` },
      { label: 'Riser height (R)', value: `${actualRiser} mm`, note: 'Max 220mm (private), 170mm (public)' },
      { label: 'Going / Tread depth (G)', value: `${going} mm`, note: 'Min 220mm (private), 300mm (public)' },
      { label: "Blondel's rule (2R + G)", value: `${blondelCheck} mm — ${blondelOk ? '✓ Comfortable' : '⚠ Adjust riser'}`, note: 'Target: 600–640 mm' },
      { label: 'Total horizontal run', value: `${totalRun} mm (${(totalRun / 1000).toFixed(2)} m)` },
      { label: 'Minimum stair width', value: minWidth },
      { label: 'Landing requirement', value: landingEvery },
      { label: 'Handrail height', value: '900 mm (residential), 1,100 mm (public)' },
      { label: 'Nosing', value: '15–25 mm overhang, no sharp edge' },
    ],
    warnings: !blondelOk ? [`Blondel result ${blondelCheck}mm is outside comfortable range. Try riser of ${Math.round((630 - going) / 2)} mm.`] : [],
    reference: "Neufert 4th Edition, BS 5395-1, Blondel's Rule (1672)",
  }
}

// ─── RAMP ────────────────────────────────────────────────────────────────────
interface RampParams {
  height_mm: number
  use?: 'accessible' | 'vehicle' | 'service'
}

function calcRamp(p: RampParams): CalcResult {
  const use = p.use ?? 'accessible'

  const slopes = {
    accessible: { max: 1 / 20, label: '1:20 (5%)', width: '≥ 1,200 mm (1,500 mm recommended)' },
    vehicle: { max: 1 / 10, label: '1:10 (10%)', width: '≥ 3,000 mm single lane, 5,500 mm double' },
    service: { max: 1 / 8, label: '1:8 (12.5%)', width: '≥ 1,500 mm' },
  }

  const s = slopes[use]
  const runMm = Math.ceil(p.height_mm / s.max)
  const numLandings = Math.floor(p.height_mm / 500)
  const landingLength = use === 'accessible' ? '≥ 1,500 mm long' : '≥ 2,400 mm long'
  const totalLength = runMm + numLandings * (use === 'accessible' ? 1500 : 2400)

  return {
    title: 'Ramp Calculator',
    summary: `To overcome ${p.height_mm} mm at max ${s.label}, the ramp runs ~${(runMm / 1000).toFixed(2)} m horizontally.`,
    details: [
      { label: 'Height to overcome', value: `${p.height_mm} mm` },
      { label: 'Maximum slope', value: s.label },
      { label: 'Horizontal run (no landings)', value: `${runMm} mm (${(runMm / 1000).toFixed(2)} m)` },
      { label: 'Landings required', value: `${numLandings} landing${numLandings !== 1 ? 's' : ''} (every 500 mm rise change)`, note: landingLength },
      { label: 'Total length with landings', value: `≈ ${(totalLength / 1000).toFixed(2)} m` },
      { label: 'Minimum width', value: s.width },
      { label: 'Edge protection', value: '100 mm upstand or kerb required (accessible ramps)' },
      { label: 'Surface', value: 'Non-slip, colour contrasting at top/bottom' },
    ],
    warnings: use === 'vehicle' && p.height_mm > 3000 ? ['Long vehicle ramp — consider split-level or helix design.'] : [],
    reference: 'ISO 21542, ADA Standards, BS 8300',
  }
}

// ─── PARKING ─────────────────────────────────────────────────────────────────
interface ParkingParams {
  gfa_sqm: number
  building_type: 'office' | 'residential' | 'retail' | 'hotel' | 'mixed'
  units?: number  // for residential
}

function calcParking(p: ParkingParams): CalcResult {
  const ratios: Record<string, { ratio: string; spacesFormula: (gfa: number, units?: number) => number }> = {
    office: { ratio: '1 space / 35 m² NFA', spacesFormula: (gfa) => Math.ceil(gfa * 0.85 / 35) },
    residential: { ratio: '1–1.5 spaces / unit', spacesFormula: (_, units) => Math.ceil((units ?? 0) * 1.2) },
    retail: { ratio: '1 space / 25 m² GFA', spacesFormula: (gfa) => Math.ceil(gfa / 25) },
    hotel: { ratio: '0.75 space / room', spacesFormula: (_, units) => Math.ceil((units ?? 0) * 0.75) },
    mixed: { ratio: '1 space / 30 m² GFA (blended)', spacesFormula: (gfa) => Math.ceil(gfa / 30) },
  }

  const r = ratios[p.building_type]
  const spaces = r.spacesFormula(p.gfa_sqm, p.units)
  const accessibleSpaces = Math.max(1, Math.ceil(spaces * 0.02)) // 2% minimum accessible
  const areaPerSpace = 28 // m² including aisle
  const totalParkingArea = spaces * areaPerSpace

  return {
    title: 'Parking Calculator',
    summary: `${p.gfa_sqm.toLocaleString()} m² ${p.building_type} → approximately ${spaces} parking spaces required.`,
    details: [
      { label: 'Parking ratio', value: r.ratio },
      { label: 'Required spaces', value: `${spaces} spaces` },
      { label: 'Accessible spaces (2%)', value: `${accessibleSpaces} spaces` },
      { label: 'Standard stall', value: '2,500 × 5,000 mm' },
      { label: 'Accessible stall', value: '3,600 × 5,000 mm (+ 1,200 mm access aisle)' },
      { label: 'Aisle width (90° parking)', value: '6,000 mm minimum (6,500 mm recommended)' },
      { label: 'Area per space (incl. aisle)', value: '~25–30 m²' },
      { label: 'Total estimated parking area', value: `~${totalParkingArea.toLocaleString()} m²` },
      { label: 'Structural bay for parking', value: '15 m × 16 m (fits 3 stalls + 2 half-aisles)' },
      { label: 'Clearance height', value: '2,200 mm min / 2,500 mm recommended' },
    ],
    warnings:
      p.building_type === 'residential' && !p.units
        ? ['Enter number of residential units for an accurate count.']
        : [],
    reference: 'Neufert, local planning ratios (verify with local authority)',
  }
}

// ─── FAR / PLOT RATIO ────────────────────────────────────────────────────────
interface FARParams {
  site_area_sqm: number
  gfa_sqm?: number
  footprint_sqm?: number
  target_far?: number
}

function calcFAR(p: FARParams): CalcResult {
  const far = p.gfa_sqm ? p.gfa_sqm / p.site_area_sqm : null
  const coverage = p.footprint_sqm ? (p.footprint_sqm / p.site_area_sqm) * 100 : null
  const maxGFA = p.target_far ? p.target_far * p.site_area_sqm : null

  return {
    title: 'FAR & Site Coverage Calculator',
    summary: far
      ? `FAR = ${far.toFixed(2)} — your GFA is ${far.toFixed(2)}× your site area.`
      : `Site area: ${p.site_area_sqm.toLocaleString()} m². Max GFA at FAR ${p.target_far}: ${maxGFA?.toLocaleString()} m².`,
    details: [
      { label: 'Site area', value: `${p.site_area_sqm.toLocaleString()} m²` },
      ...(p.gfa_sqm ? [{ label: 'Gross Floor Area (GFA)', value: `${p.gfa_sqm.toLocaleString()} m²` }] : []),
      ...(far !== null ? [{ label: 'Floor Area Ratio (FAR)', value: far.toFixed(2), note: 'GFA ÷ Site Area' }] : []),
      ...(coverage !== null ? [{ label: 'Site coverage', value: `${coverage.toFixed(1)}%`, note: 'Footprint ÷ Site Area × 100' }] : []),
      ...(p.target_far ? [{ label: `Max GFA at FAR ${p.target_far}`, value: `${maxGFA?.toLocaleString()} m²` }] : []),
      { label: 'Typical FAR ranges', value: 'Suburban: 0.3–1.0 | Urban: 1–4 | High-density: 4–10+' },
    ],
    warnings: far && far > 8 ? ['Very high FAR — verify local planning authority allowance.'] : [],
    reference: 'Urban Land Institute, local planning codes',
  }
}

// ─── DAYLIGHTING ─────────────────────────────────────────────────────────────
interface DaylightParams {
  floor_area_sqm: number
  ceiling_height_m: number
  room_depth_m: number
  glazing_type?: 'clear' | 'tinted' | 'low-e'
}

function calcDaylight(p: DaylightParams): CalcResult {
  const transmittance = p.glazing_type === 'tinted' ? 0.45 : p.glazing_type === 'low-e' ? 0.60 : 0.75
  // Minimum window area: 10% floor area (minimum), 20-25% recommended
  const minWindow = p.floor_area_sqm * 0.10
  const recWindow = p.floor_area_sqm * 0.22
  // Effective daylight depth: 2.5× floor-to-ceiling
  const effectiveDepth = p.ceiling_height_m * 2.5
  const daylitPercent = Math.min(100, (effectiveDepth / p.room_depth_m) * 100)
  // Rough daylight factor estimate (simplified)
  const dfEstimate = ((recWindow * transmittance * 0.45) / (p.floor_area_sqm * Math.PI)).toFixed(2)

  return {
    title: 'Daylighting Calculator',
    summary: `For a ${p.floor_area_sqm} m² room, minimum window area is ${minWindow.toFixed(1)} m²; recommended is ${recWindow.toFixed(1)} m².`,
    details: [
      { label: 'Minimum window area (10% floor)', value: `${minWindow.toFixed(1)} m²`, note: 'Building regulation minimum (UK/EU)' },
      { label: 'Recommended window area (22%)', value: `${recWindow.toFixed(1)} m²`, note: 'For good daylighting quality' },
      { label: 'Glazing transmittance', value: `${(transmittance * 100).toFixed(0)}% (${p.glazing_type ?? 'clear'})` },
      { label: 'Effective daylight depth', value: `${effectiveDepth.toFixed(1)} m`, note: '2.5× ceiling height from window' },
      { label: 'Daylit zone (% of room depth)', value: `${daylitPercent.toFixed(0)}%`, note: `Room depth: ${p.room_depth_m} m` },
      { label: 'Estimated average daylight factor', value: `~${dfEstimate}%`, note: 'DF > 2% = well-lit, 1–2% = adequate' },
      { label: 'Target DF by use', value: 'Office: 2–5% | Studio/Art: 5%+ | Classroom: 3–5% | Residential: 1.5–2%' },
    ],
    warnings:
      daylitPercent < 60
        ? ['Less than 60% of the room is effectively daylit from one side. Consider rooflights, light wells, or clerestory glazing.']
        : [],
    reference: 'CIBSE LG10, BRE Guide to Daylighting, BS EN 17037',
  }
}

// ─── STRUCTURAL BAY ──────────────────────────────────────────────────────────
interface StructuralBayParams {
  span_m: number
  system: 'steel_beam' | 'concrete_flat_slab' | 'concrete_beam' | 'timber'
  load_type?: 'light' | 'medium' | 'heavy'
}

function calcStructuralBay(p: StructuralBayParams): CalcResult {
  const ratios: Record<string, { depth: string; note: string }> = {
    steel_beam: { depth: `Span / 18–22 = ${(p.span_m * 1000 / 20).toFixed(0)} mm`, note: 'For UB sections under uniform load' },
    concrete_flat_slab: { depth: `Span / 28–32 = ${(p.span_m * 1000 / 30).toFixed(0)} mm`, note: 'No beams, flat soffit' },
    concrete_beam: { depth: `Span / 15–18 = ${(p.span_m * 1000 / 16).toFixed(0)} mm`, note: 'Beam + slab system' },
    timber: { depth: `Span / 16–20 = ${(p.span_m * 1000 / 18).toFixed(0)} mm`, note: 'Glulam / LVL beams' },
  }

  const economic = {
    steel_beam: '8–20 m (optimal 9–15 m)',
    concrete_flat_slab: '5–10 m (optimal 6–9 m)',
    concrete_beam: '5–14 m (optimal 6–10 m)',
    timber: '4–12 m (optimal 5–9 m)',
  }

  const r = ratios[p.system]

  return {
    title: 'Structural Bay Estimator',
    summary: `For a ${p.span_m} m ${p.system.replace(/_/g, ' ')} span, estimated member depth is ~${r.depth}.`,
    details: [
      { label: 'Span', value: `${p.span_m} m` },
      { label: 'System', value: p.system.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
      { label: 'Estimated depth', value: r.depth, note: r.note },
      { label: 'Economic span range', value: economic[p.system] },
      { label: 'Column sizing (rough)', value: `Section depth ≈ Height / 20–25`, note: 'Structural engineer must verify' },
      { label: 'Typical bay module', value: '6 × 6 m, 7.5 × 7.5 m, or 8.1 × 8.1 m (parking-compatible)' },
    ],
    warnings: ['All structural sizing is indicative only. A structural engineer must be engaged for design.'],
    reference: 'Structural Design for Architecture (Steedman & Macdonald), RIBA Guides',
  }
}

// ─── ACOUSTIC RT60 ───────────────────────────────────────────────────────────
interface AcousticParams {
  volume_m3: number
  room_type: 'office' | 'classroom' | 'concert_hall' | 'restaurant' | 'recording_studio' | 'church' | 'sports_hall'
}

function calcAcoustic(p: AcousticParams): CalcResult {
  const targets: Record<string, { min: number; max: number; note: string }> = {
    office: { min: 0.4, max: 0.6, note: 'Speech clarity priority' },
    classroom: { min: 0.4, max: 0.6, note: 'Speech intelligibility essential' },
    concert_hall: { min: 1.5, max: 2.2, note: 'Classical music: 1.8–2.0s ideal' },
    restaurant: { min: 0.6, max: 1.0, note: 'Balance privacy and atmosphere' },
    recording_studio: { min: 0.2, max: 0.4, note: 'Very dead space required' },
    church: { min: 2.0, max: 4.0, note: 'Reverberant for choral music' },
    sports_hall: { min: 0.8, max: 1.5, note: 'Reduce echo, maintain liveliness' },
  }

  const t = targets[p.room_type]
  const targetRT = (t.min + t.max) / 2
  // Sabine formula: RT60 = 0.161 × V / A → A = 0.161 × V / RT
  const absorptionNeeded = (0.161 * p.volume_m3) / targetRT

  return {
    title: 'Acoustic RT60 Calculator',
    summary: `A ${p.volume_m3} m³ ${p.room_type.replace(/_/g, ' ')} should target RT60 of ${t.min}–${t.max} s.`,
    details: [
      { label: 'Room volume', value: `${p.volume_m3.toLocaleString()} m³` },
      { label: 'Room type', value: p.room_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
      { label: 'Target RT60 range', value: `${t.min} – ${t.max} seconds`, note: t.note },
      { label: 'Absorption needed (Sabine)', value: `~${absorptionNeeded.toFixed(1)} m² (sabins)`, note: 'RT60 = 0.161 × V / A' },
      { label: 'High-absorption materials', value: 'Acoustic panels α=0.8–0.95, heavy curtains α=0.5–0.7' },
      { label: 'Low-absorption materials', value: 'Concrete α=0.02, glass α=0.03–0.05, plaster α=0.05' },
    ],
    warnings: ['RT60 values are frequency-dependent. Full acoustic analysis required for performance spaces.'],
    reference: 'Sabine formula (1900), BS EN ISO 3382, Architectural Acoustics (Marshall Long)',
  }
}

// ─── ACCESSIBLE DIMENSIONS ───────────────────────────────────────────────────
interface AccessibleParams {
  element?: 'all' | 'door' | 'corridor' | 'toilet' | 'parking' | 'lift'
}

function calcAccessible(_p: AccessibleParams): CalcResult {
  const elements = [
    { label: 'Door clear width', value: '800 mm min / 850 mm recommended / 900 mm preferred' },
    { label: 'Corridor width', value: '1,200 mm min / 1,500 mm recommended (for passing)' },
    { label: 'Turning circle (wheelchair)', value: '1,500 mm diameter (1,800 mm preferred)' },
    { label: 'Accessible toilet cubicle', value: '1,500 × 2,200 mm (min) / 2,200 × 2,200 mm (preferred)' },
    { label: 'WC transfer space', value: '900 mm clear beside pan' },
    { label: 'Wash basin knee clearance', value: '700 mm high, 300 mm deep below' },
    { label: 'Accessible parking stall', value: '3,600 mm wide (includes 1,200 mm access zone)' },
    { label: 'Accessible lift cab', value: '1,100 × 1,400 mm min / 1,500 × 2,000 mm preferred' },
    { label: 'Max forward reach', value: '1,200 mm AFF' },
    { label: 'Max side reach', value: '1,400 mm AFF' },
    { label: 'Controls / switches', value: '900–1,200 mm AFF' },
    { label: 'Steps at threshold', value: 'Max 13 mm, chamfered' },
    { label: 'Tactile warning strip', value: '400–600 mm depth before hazard' },
  ]

  return {
    title: 'Accessible Dimensions Reference',
    summary: 'Key accessible design dimensions per ISO 21542, ADA Standards, and BS 8300.',
    details: elements,
    reference: 'ISO 21542:2021, ADA Standards for Accessible Design, BS 8300, Neufert',
  }
}

// ─── PROGRAM AREA ─────────────────────────────────────────────────────────────
interface ProgramAreaParams {
  spaces: { name: string; area_sqm: number; quantity?: number }[]
  efficiency_factor?: number  // GFA/NFA ratio, typically 1.2–1.4
}

function calcProgramArea(p: ProgramAreaParams): CalcResult {
  const factor = p.efficiency_factor ?? 1.3
  const totalNFA = p.spaces.reduce((sum, s) => sum + s.area_sqm * (s.quantity ?? 1), 0)
  const totalGFA = Math.ceil(totalNFA * factor)
  const circulation = totalGFA - totalNFA

  return {
    title: 'Program Area Calculator',
    summary: `Net Floor Area: ${totalNFA.toLocaleString()} m² → Gross Floor Area (×${factor}): ~${totalGFA.toLocaleString()} m²`,
    details: [
      ...p.spaces.map(s => ({
        label: `${s.name}${s.quantity && s.quantity > 1 ? ` (×${s.quantity})` : ''}`,
        value: `${(s.area_sqm * (s.quantity ?? 1)).toLocaleString()} m²`,
      })),
      { label: '─────', value: '─────' },
      { label: 'Total Net Floor Area (NFA)', value: `${totalNFA.toLocaleString()} m²` },
      { label: 'Efficiency factor applied', value: `×${factor}`, note: 'Accounts for walls, circulation, structure (20–40% of NFA)' },
      { label: 'Estimated Gross Floor Area (GFA)', value: `${totalGFA.toLocaleString()} m²` },
      { label: 'Circulation / walls / structure', value: `~${circulation.toLocaleString()} m²` },
    ],
    reference: 'RIBA Plan of Work, Neufert building type standards',
  }
}

// ─── MAIN DISPATCHER ─────────────────────────────────────────────────────────
export function runCalculation(type: CalcType, params: Record<string, unknown>): CalcResult {
  switch (type) {
    case 'elevator':
      return calcElevator(params as unknown as ElevatorParams)
    case 'staircase':
      return calcStaircase(params as unknown as StaircaseParams)
    case 'ramp':
      return calcRamp(params as unknown as RampParams)
    case 'parking':
      return calcParking(params as unknown as ParkingParams)
    case 'far':
      return calcFAR(params as unknown as FARParams)
    case 'daylight':
      return calcDaylight(params as unknown as DaylightParams)
    case 'structural_bay':
      return calcStructuralBay(params as unknown as StructuralBayParams)
    case 'acoustic':
      return calcAcoustic(params as unknown as AcousticParams)
    case 'accessible_dimensions':
      return calcAccessible((params as unknown as AccessibleParams) ?? {})
    case 'program_area':
      return calcProgramArea(params as unknown as ProgramAreaParams)
    default:
      return {
        title: 'Unknown Calculation',
        summary: 'Calculation type not recognized.',
        details: [],
        warnings: ['Please specify a valid calculation type.'],
      }
  }
}
