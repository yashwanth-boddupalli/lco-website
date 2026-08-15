/**
 * Tiranga Cable TV & Internet - Customer Management Module
 * =========================================================
 * CRUD operations for the customers table via Supabase.
 * Dependencies: config.js, supabase-client.js, auth.js, roles.js
 */

const TirangaCustomers = (function () {
  'use strict';

  /**
   * Fetch all customers, optionally filtered
   * @param {object} filters - { search, status, connection_type }
   * @returns {Promise<Array>}
   */
  async function getAll(filters = {}) {
    if (!tirangaSupabase) {
      console.error('[Customers] Supabase client not initialized');
      return [];
    }

    try {
      let query = tirangaSupabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.connection_type) query = query.eq('connection_type', filters.connection_type);
      if (filters.search) {
        const s = `%${filters.search}%`;
        query = query.or(`customer_id.ilike.${s},full_name.ilike.${s},phone.ilike.${s},area.ilike.${s}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Customers] Fetch error:', error.message);
        throw new Error(error.message);
      }

      return data || [];
    } catch (err) {
      console.error('[Customers] getAll failed:', err);
      throw err;
    }
  }

  /**
   * Fetch a single customer by UUID
   * @param {string} id - The customer UUID
   * @returns {Promise<object|null>}
   */
  async function getById(id) {
    if (!tirangaSupabase) {
      console.error('[Customers] Supabase client not initialized');
      return null;
    }

    try {
      const { data, error } = await tirangaSupabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[Customers] Fetch by ID error:', error.message);
        return null;
      }

      return data;
    } catch (err) {
      console.error('[Customers] getById failed:', err);
      return null;
    }
  }

  /**
   * Generate next customer ID via the DB function.
   * Falls back to a timestamp-based ID if the function is unavailable.
   * @returns {Promise<string|null>}
   */
  async function generateId() {
    if (!tirangaSupabase) return null;

    try {
      const { data, error } = await tirangaSupabase.rpc('generate_customer_id');

      if (error) {
        console.warn('[Customers] generate_customer_id() RPC not available, using fallback:', error.message);
        // Fallback: generate a timestamp-based customer ID
        const ts = Date.now().toString(36).toUpperCase();
        return 'TC-' + ts;
      }

      return data;
    } catch (err) {
      console.warn('[Customers] ID generation error, using fallback:', err);
      const ts = Date.now().toString(36).toUpperCase();
      return 'TC-' + ts;
    }
  }

  /**
   * Insert a new customer
   * @param {object} customer - Customer data (without customer_id)
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async function create(customer) {
    if (!tirangaSupabase) {
      return { success: false, error: 'Supabase client not initialized.' };
    }

    try {
      const newId = await generateId();
      if (!newId) return { success: false, error: 'Could not generate customer ID.' };

      customer.customer_id = newId;

      const { data, error } = await tirangaSupabase
        .from('customers')
        .insert([customer])
        .select()
        .single();

      if (error) {
        console.error('[Customers] Create error:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      console.error('[Customers] create failed:', err);
      return { success: false, error: err.message || 'Failed to create customer.' };
    }
  }

  /**
   * Update an existing customer by UUID
   * @param {string} id - Customer UUID
   * @param {object} updates - Fields to update
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async function update(id, updates) {
    if (!tirangaSupabase) {
      return { success: false, error: 'Supabase client not initialized.' };
    }

    try {
      updates.updated_at = new Date().toISOString();

      const { data, error } = await tirangaSupabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[Customers] Update error:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      console.error('[Customers] update failed:', err);
      return { success: false, error: err.message || 'Failed to update customer.' };
    }
  }

  /**
   * Delete a customer by UUID
   * @param {string} id - Customer UUID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function remove(id) {
    if (!tirangaSupabase) {
      return { success: false, error: 'Supabase client not initialized.' };
    }

    try {
      const { error } = await tirangaSupabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[Customers] Delete error:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('[Customers] remove failed:', err);
      return { success: false, error: err.message || 'Failed to delete customer.' };
    }
  }

  /**
   * Get dashboard statistics from real data
   * @returns {Promise<{total, active, inactive, internet, cable_tv, combo, revenue}>}
   */
  async function getStats() {
    try {
      const all = await getAll();
      const active = all.filter(c => c.status === 'active');
      const inactive = all.filter(c => c.status !== 'active');
      const revenue = active.reduce((sum, c) => sum + (parseFloat(c.monthly_fee) || 0), 0);

      return {
        total: all.length,
        active: active.length,
        inactive: inactive.length,
        internet: all.filter(c => c.connection_type === 'internet').length,
        cable_tv: all.filter(c => c.connection_type === 'cable_tv').length,
        combo: all.filter(c => c.connection_type === 'combo').length,
        revenue
      };
    } catch (err) {
      console.error('[Customers] getStats failed:', err);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        internet: 0,
        cable_tv: 0,
        combo: 0,
        revenue: 0
      };
    }
  }

  return { getAll, getById, generateId, create, update, remove, getStats };
})();
