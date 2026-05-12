import { createClient } from '@supabase/supabase-js'
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)

export async function getRegistrations(monthKey) {
  const { data, error } = await supabase
    .from('registrations').select('*').eq('month_key', monthKey)
    .order('registered_at', { ascending: true })
  if (error) { console.error(error); return [] }
  return data
}
export async function addRegistration(reg) {
  const { data, error } = await supabase
    .from('registrations').insert([reg]).select().single()
  if (error) throw error
  return data
}
export async function checkDuplicateEmail(email, monthKey) {
  const { data } = await supabase.from('registrations').select('id')
    .eq('email', email).eq('month_key', monthKey).maybeSingle()
  return !!data
}
