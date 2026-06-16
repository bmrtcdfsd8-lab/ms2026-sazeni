import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── User ──────────────────────────────────────────────────────────────────────

export async function createUser(username) {
  const { data, error } = await supabase
    .from('users')
    .insert({ username, coins: 2000 })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchUser(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function findUserByUsername(username) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .maybeSingle()
  return data
}

export async function updateUserCoins(userId, coins) {
  const { error } = await supabase
    .from('users')
    .update({ coins })
    .eq('id', userId)
  if (error) console.warn('[supabase] updateUserCoins:', error.message)
}

// ── Bets ──────────────────────────────────────────────────────────────────────

export async function insertBets(userId, bets) {
  if (!bets.length) return
  const rows = bets.map((bet) => ({
    id: bet.id,
    user_id: userId,
    match_id: bet.matchId,
    match_label: bet.matchLabel || null,
    market: bet.marketType,
    market_label: bet.marketLabel || null,
    selection: bet.selection,
    selection_label: bet.selectionLabel || null,
    odds: bet.odds,
    stake: bet.stake,
    potential_win: bet.potentialPayout,
    status: bet.status,
    is_live: bet.isLiveBet || false,
    created_at: bet.placedAt,
  }))
  // ignoreDuplicates: true — safe to call even if some bets already exist
  const { error } = await supabase.from('bets').upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
  if (error) console.warn('[supabase] insertBets:', error.message)
}

export async function updateBetStatus(betId, status, settledAt) {
  const { error } = await supabase
    .from('bets')
    .update({ status, settled_at: settledAt })
    .eq('id', betId)
  if (error) console.warn('[supabase] updateBetStatus:', error.message)
}

export async function fetchUserBets(userId) {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    console.warn('[supabase] fetchUserBets:', error.message)
    return []
  }
  return data.map(normBet)
}

function normBet(row) {
  return {
    id: row.id,
    matchId: row.match_id,
    matchLabel: row.match_label || '',
    marketType: row.market,
    marketLabel: row.market_label || row.market,
    selection: row.selection,
    selectionLabel: row.selection_label || row.selection,
    odds: row.odds,
    stake: row.stake,
    potentialPayout: row.potential_win,
    status: row.status,
    placedAt: row.created_at,
    settledAt: row.settled_at || null,
    isLiveBet: row.is_live || false,
    placedAtMinute: null,
  }
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function fetchAllUsersAdmin() {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('coins', { ascending: false })
  if (error) throw error
  return data || []
}

export async function deleteUser(userId) {
  // bets are removed automatically via ON DELETE CASCADE on the FK
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)
  if (error) throw error
}

// ── Bans ──────────────────────────────────────────────────────────────────────

export async function banUsername(username) {
  const { error } = await supabase
    .from('banned_usernames')
    .upsert({ username }, { onConflict: 'username', ignoreDuplicates: true })
  if (error) throw error
}

export async function isUsernameBanned(username) {
  const { data } = await supabase
    .from('banned_usernames')
    .select('username')
    .eq('username', username)
    .maybeSingle()
  return !!data
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export async function fetchLeaderboard() {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('coins', { ascending: false })
    .limit(100)
  if (error) {
    console.warn('[supabase] fetchLeaderboard:', error.message)
    return []
  }
  return data
}
