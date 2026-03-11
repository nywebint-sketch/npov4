/**
 * Слой данных (Data Layer) — Supabase Integration
 */
const SUPABASE_URL = 'https://rvswpgsxutfcpgvmzonr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2c3dwZ3N4dXRmY3Bndm16b25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODQ1MTEsImV4cCI6MjA4ODY2MDUxMX0.I_XagunD2zgTVmpaOrt4SvbJbJFHAJAd2j7JpYb26oY';

let supabaseClt = null;

// Инициализация клиента
const initSupabase = () => {
  if (!window.supabase) return null;
  if (!supabaseClt) {
    supabaseClt = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClt;
};

// Функции-обертки с проверкой инициализации
const getEvents = async () => {
  const client = initSupabase();
  if (!client) return [];
  const { data, error } = await client.from('events').select('*').order('date', { ascending: true });
  return error ? [] : data;
};

const getArtists = async () => {
  const client = initSupabase();
  if (!client) return [];
  const { data, error } = await client.from('artists').select('*').order('name', { ascending: true });
  return error ? [] : data;
};

const getReleases = async () => {
  const client = initSupabase();
  if (!client) return [];
  const { data, error } = await client.from('releases').select('*').order('date', { ascending: false });
  return error ? [] : data;
};

const getPodcasts = async () => {
  const client = initSupabase();
  if (!client) return [];
  const { data, error } = await client.from('podcasts').select('*').order('date', { ascending: false });
  return error ? [] : data;
};

const getStreams = async () => {
  const client = initSupabase();
  if (!client) return [];
  const { data, error } = await client.from('streams').select('*').order('date', { ascending: false });
  return error ? [] : data;
};

const getMerch = async () => {
  const client = initSupabase();
  if (!client) return [];
  const { data, error } = await client.from('merch').select('*').order('title', { ascending: true });
  return error ? [] : data;
};

const getSession = async () => {
  const client = initSupabase();
  if (!client) return null;
  const { data: { session } } = await client.auth.getSession();
  return session;
};

const login = async (email, password) => {
  const client = initSupabase();
  return await client.auth.signInWithPassword({ email, password });
};

const register = async (email, password, name) => {
  const client = initSupabase();
  return await client.auth.signUp({ email, password, options: { data: { name } } });
};

const logout = async () => {
  const client = initSupabase();
  return await client.auth.signOut();
};

const syncDefaultData = async () => true;

// Экспорт в глобальную область
window.dbLayer = {
  getEvents, getArtists, getReleases, getPodcasts, getStreams, getMerch,
  getSession, login, register, logout, syncDefaultData
};