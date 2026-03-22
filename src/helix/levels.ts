export interface HelixLevel {
  id: number
  name: string
  segmentsPerRevolution: number | 'variable'
  radius: number
  color: string
  emissiveIntensity: number
}

export const HELIX_LEVELS: HelixLevel[] = [
  { id: 0, name: 'century',  segmentsPerRevolution: 10,         radius: 0,     color: '#8b6f47', emissiveIntensity: 0.3 },
  { id: 1, name: 'decade',   segmentsPerRevolution: 10,         radius: 8.0,   color: '#a0845c', emissiveIntensity: 0.4 },
  { id: 2, name: 'year',     segmentsPerRevolution: 12,         radius: 4.0,   color: '#b8956a', emissiveIntensity: 0.5 },
  { id: 3, name: 'month',    segmentsPerRevolution: 'variable', radius: 2.0,   color: '#d4a574', emissiveIntensity: 0.6 },
  { id: 4, name: 'day',      segmentsPerRevolution: 24,         radius: 1.0,   color: '#e8b87a', emissiveIntensity: 0.7 },
  { id: 5, name: 'hour',     segmentsPerRevolution: 60,         radius: 0.5,   color: '#f0c88a', emissiveIntensity: 0.8 },
  { id: 6, name: 'minute',   segmentsPerRevolution: 60,         radius: 0.25,  color: '#f5d49a', emissiveIntensity: 0.9 },
  { id: 7, name: 'second',   segmentsPerRevolution: 60,         radius: 0.125, color: '#fae0aa', emissiveIntensity: 1.0 },
]

export const Y_SCALE = 0.0004
