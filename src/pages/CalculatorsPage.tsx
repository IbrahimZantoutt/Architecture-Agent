import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { runCalculation, type CalcType, type CalcResult } from '../lib/calculations'

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-outfit font-medium text-text-secondary" style={{ fontSize: 12, marginBottom: 4 }}>
      {children}
    </label>
  )
}

function Input({
  value,
  onChange,
  type = 'number',
  placeholder,
  min,
  step,
}: {
  value: string | number
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  min?: number
  step?: number
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      step={step}
      className="font-outfit border border-border rounded-[10px] bg-bg-input text-text-primary w-full"
      style={{ padding: '8px 12px', fontSize: 13, outline: 'none' }}
    />
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="font-outfit border border-border rounded-[10px] bg-bg-input text-text-primary w-full"
      style={{ padding: '8px 12px', fontSize: 13, outline: 'none' }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function CalcButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="font-outfit font-semibold bg-accent hover:bg-accent-hover text-white transition-colors w-full"
      style={{ padding: '10px 20px', fontSize: 13, borderRadius: 10, marginTop: 12 }}
    >
      Calculate
    </button>
  )
}

function ResultCard({ result }: { result: CalcResult }) {
  return (
    <div
      className="bg-bg-soft border border-border rounded-[12px] mt-4"
      style={{ padding: 16 }}
    >
      <p className="font-outfit font-semibold text-text-primary" style={{ fontSize: 14, marginBottom: 8 }}>
        {result.summary}
      </p>
      <div className="flex flex-col gap-2">
        {result.details.map((d, i) =>
          d.label === '─────' ? (
            <hr key={i} style={{ border: 'none', borderTop: '1px solid #F3E8EB', margin: '4px 0' }} />
          ) : (
            <div key={i} className="flex gap-3" style={{ fontSize: 12.5 }}>
              <span className="font-outfit font-medium text-text-secondary flex-shrink-0" style={{ minWidth: 180 }}>
                {d.label}
              </span>
              <span className="font-outfit text-text-primary">
                {d.value}
                {d.note && <span className="text-text-muted"> — {d.note}</span>}
              </span>
            </div>
          )
        )}
      </div>
      {result.warnings && result.warnings.length > 0 && (
        <div
          className="border border-border-strong rounded-[8px] mt-3"
          style={{ padding: '8px 12px', background: '#FFF5F7' }}
        >
          {result.warnings.map((w, i) => (
            <p key={i} className="font-outfit text-accent" style={{ fontSize: 12 }}>
              ⚠ {w}
            </p>
          ))}
        </div>
      )}
      {result.reference && (
        <p className="font-outfit text-text-muted mt-2" style={{ fontSize: 11 }}>
          Ref: {result.reference}
        </p>
      )}
    </div>
  )
}

// ─── Calculator card wrapper ──────────────────────────────────────────────────
function CalcCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-bg-card border border-border rounded-[14px] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left"
        style={{ padding: '16px 20px' }}
      >
        <div>
          <p className="font-outfit font-semibold text-text-primary" style={{ fontSize: 14 }}>
            {title}
          </p>
          <p className="font-outfit text-text-muted" style={{ fontSize: 12, marginTop: 2 }}>
            {description}
          </p>
        </div>
        {open ? (
          <ChevronUp size={18} color="#9CA3AF" />
        ) : (
          <ChevronDown size={18} color="#9CA3AF" />
        )}
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px' }}>
          <hr style={{ border: 'none', borderTop: '1px solid #F3E8EB', marginBottom: 16 }} />
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Individual calculators ───────────────────────────────────────────────────

function ElevatorCalc() {
  const [floors, setFloors] = useState('10')
  const [occ, setOcc] = useState('50')
  const [type, setType] = useState('office')
  const [result, setResult] = useState<CalcResult | null>(null)

  const run = () =>
    setResult(runCalculation('elevator' as CalcType, {
      floors: Number(floors),
      occupancy_per_floor: Number(occ),
      building_type: type,
    }))

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Number of floors</Label><Input value={floors} onChange={setFloors} min={2} /></div>
        <div><Label>Occupants per floor</Label><Input value={occ} onChange={setOcc} min={1} /></div>
        <div className="col-span-2">
          <Label>Building type</Label>
          <Select value={type} onChange={setType} options={[
            { value: 'office', label: 'Office' },
            { value: 'residential', label: 'Residential' },
            { value: 'hotel', label: 'Hotel' },
            { value: 'hospital', label: 'Hospital' },
            { value: 'retail', label: 'Retail' },
          ]} />
        </div>
      </div>
      <CalcButton onClick={run} />
      {result && <ResultCard result={result} />}
    </div>
  )
}

function StaircaseCalc() {
  const [rise, setRise] = useState('3000')
  const [riser, setRiser] = useState('170')
  const [type, setType] = useState('public')
  const [result, setResult] = useState<CalcResult | null>(null)

  const run = () =>
    setResult(runCalculation('staircase' as CalcType, {
      total_rise_mm: Number(rise),
      riser_mm: Number(riser),
      building_type: type,
    }))

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Total rise (mm)</Label><Input value={rise} onChange={setRise} placeholder="e.g. 3000" /></div>
        <div><Label>Desired riser height (mm)</Label><Input value={riser} onChange={setRiser} placeholder="150–200" /></div>
        <div className="col-span-2">
          <Label>Building type</Label>
          <Select value={type} onChange={setType} options={[
            { value: 'public', label: 'Public / Commercial' },
            { value: 'residential', label: 'Residential' },
            { value: 'escape', label: 'Escape stair (fire egress)' },
          ]} />
        </div>
      </div>
      <CalcButton onClick={run} />
      {result && <ResultCard result={result} />}
    </div>
  )
}

function RampCalc() {
  const [height, setHeight] = useState('600')
  const [use, setUse] = useState('accessible')
  const [result, setResult] = useState<CalcResult | null>(null)

  const run = () =>
    setResult(runCalculation('ramp' as CalcType, {
      height_mm: Number(height),
      use,
    }))

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Height to overcome (mm)</Label><Input value={height} onChange={setHeight} placeholder="e.g. 600" /></div>
        <div>
          <Label>Ramp use</Label>
          <Select value={use} onChange={setUse} options={[
            { value: 'accessible', label: 'Accessible / pedestrian (max 1:20)' },
            { value: 'vehicle', label: 'Vehicle / parking (max 1:10)' },
            { value: 'service', label: 'Service / loading (max 1:8)' },
          ]} />
        </div>
      </div>
      <CalcButton onClick={run} />
      {result && <ResultCard result={result} />}
    </div>
  )
}

function ParkingCalc() {
  const [gfa, setGfa] = useState('5000')
  const [type, setType] = useState('office')
  const [units, setUnits] = useState('')
  const [result, setResult] = useState<CalcResult | null>(null)

  const run = () =>
    setResult(runCalculation('parking' as CalcType, {
      gfa_sqm: Number(gfa),
      building_type: type,
      units: units ? Number(units) : undefined,
    }))

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Gross floor area (m²)</Label><Input value={gfa} onChange={setGfa} /></div>
        <div>
          <Label>Building type</Label>
          <Select value={type} onChange={setType} options={[
            { value: 'office', label: 'Office' },
            { value: 'residential', label: 'Residential' },
            { value: 'retail', label: 'Retail' },
            { value: 'hotel', label: 'Hotel' },
            { value: 'mixed', label: 'Mixed use' },
          ]} />
        </div>
        {(type === 'residential' || type === 'hotel') && (
          <div className="col-span-2">
            <Label>{type === 'hotel' ? 'Number of rooms' : 'Number of units / apartments'}</Label>
            <Input value={units} onChange={setUnits} placeholder="e.g. 80" />
          </div>
        )}
      </div>
      <CalcButton onClick={run} />
      {result && <ResultCard result={result} />}
    </div>
  )
}

function FARCalc() {
  const [site, setSite] = useState('2000')
  const [gfa, setGfa] = useState('')
  const [footprint, setFootprint] = useState('')
  const [targetFar, setTargetFar] = useState('')
  const [result, setResult] = useState<CalcResult | null>(null)

  const run = () =>
    setResult(runCalculation('far' as CalcType, {
      site_area_sqm: Number(site),
      gfa_sqm: gfa ? Number(gfa) : undefined,
      footprint_sqm: footprint ? Number(footprint) : undefined,
      target_far: targetFar ? Number(targetFar) : undefined,
    }))

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label>Site area (m²) *</Label><Input value={site} onChange={setSite} /></div>
        <div><Label>GFA (m²) — to calculate FAR</Label><Input value={gfa} onChange={setGfa} placeholder="optional" /></div>
        <div><Label>Building footprint (m²) — for coverage</Label><Input value={footprint} onChange={setFootprint} placeholder="optional" /></div>
        <div className="col-span-2"><Label>Target FAR — to find max GFA</Label><Input value={targetFar} onChange={setTargetFar} placeholder="e.g. 2.5" step={0.1} /></div>
      </div>
      <CalcButton onClick={run} />
      {result && <ResultCard result={result} />}
    </div>
  )
}

function DaylightCalc() {
  const [floorArea, setFloorArea] = useState('80')
  const [ceilHeight, setCeilHeight] = useState('2.8')
  const [depth, setDepth] = useState('8')
  const [glazing, setGlazing] = useState('clear')
  const [result, setResult] = useState<CalcResult | null>(null)

  const run = () =>
    setResult(runCalculation('daylight' as CalcType, {
      floor_area_sqm: Number(floorArea),
      ceiling_height_m: Number(ceilHeight),
      room_depth_m: Number(depth),
      glazing_type: glazing,
    }))

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Floor area (m²)</Label><Input value={floorArea} onChange={setFloorArea} /></div>
        <div><Label>Ceiling height (m)</Label><Input value={ceilHeight} onChange={setCeilHeight} step={0.1} /></div>
        <div><Label>Room depth from window (m)</Label><Input value={depth} onChange={setDepth} step={0.5} /></div>
        <div>
          <Label>Glazing type</Label>
          <Select value={glazing} onChange={setGlazing} options={[
            { value: 'clear', label: 'Clear glass (~75% transmittance)' },
            { value: 'low-e', label: 'Low-E glass (~60%)' },
            { value: 'tinted', label: 'Tinted / solar control (~45%)' },
          ]} />
        </div>
      </div>
      <CalcButton onClick={run} />
      {result && <ResultCard result={result} />}
    </div>
  )
}

function StructuralBayCalc() {
  const [span, setSpan] = useState('8')
  const [system, setSystem] = useState('steel_beam')
  const [result, setResult] = useState<CalcResult | null>(null)

  const run = () =>
    setResult(runCalculation('structural_bay' as CalcType, {
      span_m: Number(span),
      system,
    }))

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Span (m)</Label><Input value={span} onChange={setSpan} step={0.5} /></div>
        <div>
          <Label>Structural system</Label>
          <Select value={system} onChange={setSystem} options={[
            { value: 'steel_beam', label: 'Steel beam + slab' },
            { value: 'concrete_flat_slab', label: 'Concrete flat slab' },
            { value: 'concrete_beam', label: 'Concrete beam + slab' },
            { value: 'timber', label: 'Timber (glulam / LVL)' },
          ]} />
        </div>
      </div>
      <CalcButton onClick={run} />
      {result && <ResultCard result={result} />}
    </div>
  )
}

function AcousticCalc() {
  const [vol, setVol] = useState('500')
  const [roomType, setRoomType] = useState('classroom')
  const [result, setResult] = useState<CalcResult | null>(null)

  const run = () =>
    setResult(runCalculation('acoustic' as CalcType, {
      volume_m3: Number(vol),
      room_type: roomType,
    }))

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Room volume (m³)</Label><Input value={vol} onChange={setVol} /></div>
        <div>
          <Label>Room type</Label>
          <Select value={roomType} onChange={setRoomType} options={[
            { value: 'classroom', label: 'Classroom' },
            { value: 'office', label: 'Open office' },
            { value: 'concert_hall', label: 'Concert hall' },
            { value: 'restaurant', label: 'Restaurant / café' },
            { value: 'recording_studio', label: 'Recording studio' },
            { value: 'church', label: 'Church / place of worship' },
            { value: 'sports_hall', label: 'Sports hall / gym' },
          ]} />
        </div>
      </div>
      <CalcButton onClick={run} />
      {result && <ResultCard result={result} />}
    </div>
  )
}

function AccessibleDimRef() {
  const [result, setResult] = useState<CalcResult | null>(null)
  return (
    <div>
      <p className="font-outfit text-text-secondary" style={{ fontSize: 12.5, marginBottom: 12 }}>
        Tap below to load the full accessible design dimensions reference (ISO 21542, ADA, BS 8300).
      </p>
      <CalcButton onClick={() => setResult(runCalculation('accessible_dimensions' as CalcType, {}))} />
      {result && <ResultCard result={result} />}
    </div>
  )
}

function ProgramAreaCalc() {
  const [spaces, setSpaces] = useState([
    { name: 'Reception', area: '40', qty: '1' },
    { name: 'Office', area: '20', qty: '10' },
    { name: 'Meeting room', area: '30', qty: '3' },
    { name: 'Toilets', area: '25', qty: '2' },
    { name: 'Kitchen / break room', area: '20', qty: '1' },
  ])
  const [efficiency, setEfficiency] = useState('1.3')
  const [result, setResult] = useState<CalcResult | null>(null)

  const addSpace = () => setSpaces((prev) => [...prev, { name: '', area: '0', qty: '1' }])
  const removeSpace = (i: number) => setSpaces((prev) => prev.filter((_, idx) => idx !== i))
  const updateSpace = (i: number, field: 'name' | 'area' | 'qty', val: string) =>
    setSpaces((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)))

  const run = () =>
    setResult(runCalculation('program_area' as CalcType, {
      spaces: spaces.map((s) => ({ name: s.name, area_sqm: Number(s.area), quantity: Number(s.qty) })),
      efficiency_factor: Number(efficiency),
    }))

  return (
    <div>
      <div className="flex flex-col gap-2 mb-3">
        {spaces.map((s, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={s.name}
              onChange={(e) => updateSpace(i, 'name', e.target.value)}
              placeholder="Space name"
              className="font-outfit border border-border rounded-[8px] bg-bg-input text-text-primary flex-1"
              style={{ padding: '6px 10px', fontSize: 12.5 }}
            />
            <input
              type="number"
              value={s.area}
              onChange={(e) => updateSpace(i, 'area', e.target.value)}
              placeholder="m²"
              className="font-outfit border border-border rounded-[8px] bg-bg-input text-text-primary"
              style={{ padding: '6px 10px', fontSize: 12.5, width: 70 }}
            />
            <input
              type="number"
              value={s.qty}
              onChange={(e) => updateSpace(i, 'qty', e.target.value)}
              placeholder="qty"
              min={1}
              className="font-outfit border border-border rounded-[8px] bg-bg-input text-text-primary"
              style={{ padding: '6px 10px', fontSize: 12.5, width: 52 }}
            />
            <button onClick={() => removeSpace(i)} style={{ color: '#E8607A', fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
        ))}
      </div>

      <button
        onClick={addSpace}
        className="font-outfit text-accent border border-accent rounded-[8px]"
        style={{ padding: '5px 12px', fontSize: 12, marginBottom: 8 }}
      >
        + Add space
      </button>

      <div style={{ marginTop: 8 }}>
        <Label>Efficiency factor (NFA → GFA). Typical: 1.2–1.4</Label>
        <Input value={efficiency} onChange={setEfficiency} step={0.05} placeholder="1.3" />
      </div>

      <CalcButton onClick={run} />
      {result && <ResultCard result={result} />}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const CALC_SECTIONS = [
  {
    category: 'Vertical Circulation',
    items: [
      { comp: <ElevatorCalc />, title: 'Elevator Sizing', desc: 'Number of lifts, shaft dimensions, accessible requirements' },
      { comp: <StaircaseCalc />, title: 'Staircase Calculator', desc: "Riser height, going, Blondel's rule, total run" },
      { comp: <RampCalc />, title: 'Ramp Calculator', desc: 'Slope, horizontal run, accessible compliance, landings' },
    ],
  },
  {
    category: 'Site & Area',
    items: [
      { comp: <FARCalc />, title: 'FAR & Site Coverage', desc: 'Floor Area Ratio, coverage percentage, max buildable GFA' },
      { comp: <ParkingCalc />, title: 'Parking Requirements', desc: 'Number of spaces, stall dimensions, total area needed' },
    ],
  },
  {
    category: 'Environmental & Technical',
    items: [
      { comp: <DaylightCalc />, title: 'Daylighting', desc: 'Window area, daylight factor estimate, penetration depth' },
      { comp: <StructuralBayCalc />, title: 'Structural Bay Estimator', desc: 'Beam depth, economic spans by structural system' },
      { comp: <AcousticCalc />, title: 'Acoustic RT60', desc: 'Target reverberation time and absorption needed by room type' },
    ],
  },
  {
    category: 'Program & Accessibility',
    items: [
      { comp: <ProgramAreaCalc />, title: 'Program Area Calculator', desc: 'Space list, NFA/GFA totals with efficiency factor' },
      { comp: <AccessibleDimRef />, title: 'Accessible Dimensions Reference', desc: 'Door, corridor, toilet, lift, parking — per ISO 21542, ADA, BS 8300' },
    ],
  },
]

export function CalculatorsPage() {
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen bg-bg-soft font-outfit"
      style={{ paddingBottom: 60 }}
    >
      {/* Header */}
      <header
        className="bg-bg-card border-b border-border sticky top-0 z-10"
        style={{ padding: '14px 24px' }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors"
            style={{ fontSize: 13 }}
          >
            <ChevronLeft size={18} />
            <span className="font-medium">Back</span>
          </button>
          <div>
            <span className="font-semibold text-text-primary" style={{ fontSize: 15 }}>
              Architecture Calculators
            </span>
          </div>
          <div style={{ width: 60 }} />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto" style={{ padding: '24px 16px' }}>
        <p className="font-outfit text-text-secondary" style={{ fontSize: 13, marginBottom: 24 }}>
          Technical sizing and code references for architecture projects. Based on Neufert, ISO 21542, CIBSE, ADA, and BS 8300 standards.
          All results are indicative — verify with a structural engineer or local authority for final design.
        </p>

        {CALC_SECTIONS.map((section) => (
          <div key={section.category} style={{ marginBottom: 28 }}>
            <p
              className="font-outfit font-semibold text-text-muted uppercase tracking-wider"
              style={{ fontSize: 10.5, marginBottom: 10 }}
            >
              {section.category}
            </p>
            <div className="flex flex-col gap-3">
              {section.items.map((item) => (
                <CalcCard key={item.title} title={item.title} description={item.desc}>
                  {item.comp}
                </CalcCard>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
