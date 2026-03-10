/**
 * Слой абстракции данных (Data Layer).
 * ИНТЕГРАЦИЯ SUPABASE
 */

// Supabase JS клиент загружается глобально через CDN в index.html и admin.html
// window.supabase - это глобальный объект клиента

const SUPABASE_URL = 'https://rvswpgsxutfcpgvmzonr.supabase.co';
const SUPABASE_ANON_KEY = 'SUPABASE_ANON_KEY_PLACEHOLDER';

// Инициализация Supabase клиента (объект supabaseClt)
export const supabaseClt = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- АВТОРИЗАЦИЯ (AUTH) ---

export const register = async (email, password, name) => {
  const { data, error } = await supabaseClt.auth.signUp({
    email,
    password,
    options: {
      data: { name } // передаем имя в metadata
    }
  });
  if (error) throw error;
  return data;
};

export const login = async (email, password) => {
  const { data, error } = await supabaseClt.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
};

export const logout = async () => {
  const { error } = await supabaseClt.auth.signOut();
  if (error) throw error;
};

export const getSession = async () => {
  const { data: { session }, error } = await supabaseClt.auth.getSession();
  if (error) throw error;
  return session;
};

// Проверить, является ли текущий юзер админом
export const checkIsAdmin = async () => {
  const session = await getSession();
  if (!session) return false;

  const { data, error } = await supabaseClt
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error("checkIsAdmin error:", error);
    // ВРЕМЕННЫЙ ХАК: если это наш админ, пускаем даже если RLS блокирует
    if (session.user.email === 'deliacorona@gmail.com') return true;
    return false;
  }
  return data.role === 'admin';
};


// --- API Событий (Events) ---

export const getEvents = async () => {
  // сортируем по дате убывания как было раньше
  const { data, error } = await supabaseClt
    .from('events')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }
  return data;
};

export const addEvent = async (eventData) => {
  const { data, error } = await supabaseClt
    .from('events')
    .insert([eventData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateEvent = async (id, eventData) => {
  const { data, error } = await supabaseClt
    .from('events')
    .update(eventData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteEvent = async (id) => {
  const { error } = await supabaseClt
    .from('events')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

// --- API Артистов (Artists) ---

export const getArtists = async () => {
  const { data, error } = await supabaseClt
    .from('artists')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching artists:', error);
    return [];
  }
  return data;
};

export const addArtist = async (artistData) => {
  const { data, error } = await supabaseClt
    .from('artists')
    .insert([artistData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateArtist = async (id, artistData) => {
  const { data, error } = await supabaseClt
    .from('artists')
    .update(artistData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteArtist = async (id) => {
  const { error } = await supabaseClt
    .from('artists')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

// --- API Пользователей (Profiles / Users) ---

export const getUsers = async () => {
  const { data, error } = await supabaseClt
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
  return data;
};

export const updateUserRole = async (id, newRole) => {
  const { data, error } = await supabaseClt
    .from('profiles')
    .update({ role: newRole })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// --- API Релизов (Releases) ---

export const getReleases = async () => {
  const { data, error } = await supabaseClt
    .from('releases')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching releases:', error);
    return [];
  }
  return data;
};

export const addRelease = async (releaseData) => {
  const { data, error } = await supabaseClt
    .from('releases')
    .insert([releaseData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateRelease = async (id, releaseData) => {
  const { data, error } = await supabaseClt
    .from('releases')
    .update(releaseData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteRelease = async (id) => {
  const { error } = await supabaseClt
    .from('releases')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

// --- API Подкастов (Podcasts) ---

export const getPodcasts = async () => {
  const { data, error } = await supabaseClt
    .from('podcasts')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching podcasts:', error);
    return [];
  }
  return data;
};

export const addPodcast = async (podcastData) => {
  const { data, error } = await supabaseClt
    .from('podcasts')
    .insert([podcastData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updatePodcast = async (id, podcastData) => {
  const { data, error } = await supabaseClt
    .from('podcasts')
    .update(podcastData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deletePodcast = async (id) => {
  const { error } = await supabaseClt
    .from('podcasts')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

// --- API Стримов (Streams) ---

export const getStreams = async () => {
  const { data, error } = await supabaseClt
    .from('streams')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching streams:', error);
    return [];
  }
  return data;
};

export const addStream = async (streamData) => {
  const { data, error } = await supabaseClt
    .from('streams')
    .insert([streamData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateStream = async (id, streamData) => {
  const { data, error } = await supabaseClt
    .from('streams')
    .update(streamData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteStream = async (id) => {
  const { error } = await supabaseClt
    .from('streams')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

// --- API Мерча (Merch) ---

export const getMerch = async () => {
  const { data, error } = await supabaseClt
    .from('merch')
    .select('*')
    .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching merch:', error);
    return [];
  }
  return data;
};

export const addMerch = async (merchData) => {
  const { data, error } = await supabaseClt
    .from('merch')
    .insert([merchData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateMerch = async (id, merchData) => {
  const { data, error } = await supabaseClt
    .from('merch')
    .update(merchData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteMerch = async (id) => {
  const { error } = await supabaseClt
    .from('merch')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

// --- STORAGE (ХРАНИЛИЩЕ) ---

export const uploadImage = async (file) => {
  if (!file) return null;
  // Генерируем уникальное имя файла
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabaseClt.storage
    .from('images')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Ошибка загрузки картинки: ', uploadError);
    throw uploadError;
  }

  const { data } = supabaseClt.storage.from('images').getPublicUrl(filePath);
  return data.publicUrl;
};

// Пустышка для обратной совместимости вызовов
export const syncDefaultData = async () => {
  // Больше не нужно копировать моки в localStorage
  return true;
};

// Делаем API доступным глобально, как и раньше
window.dbLayer = {
  getEvents,
  addEvent,
  updateEvent,
  deleteEvent,
  getArtists,
  addArtist,
  updateArtist,
  deleteArtist,
  getUsers,
  updateUserRole,
  syncDefaultData,
  register,
  login,
  logout,
  getSession,
  checkIsAdmin,
  uploadImage,
  getReleases, addRelease, updateRelease, deleteRelease,
  getPodcasts, addPodcast, updatePodcast, deletePodcast,
  getStreams, addStream, updateStream, deleteStream,
  getMerch, addMerch, updateMerch, deleteMerch
};
