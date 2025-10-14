// Domain data shared between frontend & backend

export interface Medication {
  id: number
  user_id: string | null
  name: string
  dose: string | null
  route: string | null
  frequency: string | null
  started_on: string | null
  stopped_on: string | null
  notes: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface Climb {
  id: number
  climber_id: string | null
  peak: string | null
  route: string | null
  date: string | null
  duration_hours: number | null
  notes: string | null
  created_at?: string | null
  updated_at?: string | null
}
