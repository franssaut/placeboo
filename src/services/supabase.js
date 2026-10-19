import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hvyvumdfrnvkqmnimuot.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2eXZ1bWRmcm52a3FtbmltdW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MjU2MDcsImV4cCI6MjEwNzIwMTYwN30.5p430JniYNxcSzrvqEKqUgVgt7AQdFiCVWhiCWMTp3Y';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export const getSessionId = () => {
  let sid = localStorage.getItem('placeboo_session_id');
  if (!sid) {
    sid = 'DM-' + Math.floor(10000 + Math.random() * 90000);
    localStorage.setItem('placeboo_session_id', sid);
  }
  return sid;
};

// Check if table exists
export const checkHealth = async () => {
  try {
    const { error } = await supabase.from('conversions').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find')) {
        return 'schema_pending';
      }
      return 'offline';
    }
    return 'connected';
  } catch (e) {
    return 'offline';
  }
};

// Create a job in Supabase
export const insertJob = async (job) => {
  try {
    const { data, error } = await supabase
      .from('conversions')
      .insert([job])
      .select();
    if (!error && data && data[0]) {
      return data[0];
    }
  } catch (e) {
    console.warn('[Supabase insertJob Exception]:', e);
  }
  return null;
};

// Fetch jobs for current session
export const fetchJobs = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from('conversions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    if (!error && data) {
      return data;
    }
  } catch (e) {
    console.warn('[Supabase fetchJobs Exception]:', e);
  }
  return null;
};

// Update job
export const updateJobStatus = async (id, updates) => {
  try {
    await supabase.from('conversions').update(updates).eq('id', id);
  } catch (e) {}
};

// Delete job
export const deleteJobRecord = async (id) => {
  try {
    await supabase.from('conversions').delete().eq('id', id);
  } catch (e) {}
};

// Purge all jobs for session
export const purgeSessionJobs = async (sessionId) => {
  try {
    await supabase.from('conversions').delete().eq('session_id', sessionId);
  } catch (e) {}
};
