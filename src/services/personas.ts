import R from "@/types/r";

/**
 * Persona interface matching the Python Pydantic model
 */
export interface Persona {
  /** Unique identifier for the persona */
  id?: string;

  /** The name of the persona */
  name: string;

  /** Whether the persona is activated */
  activated: boolean;

  /** System relative path where persona exists */
  r_path: string;

  /** Thumbnail image path for persona */
  thumb?: string;

  /** The last update timestamp of the persona */
  updated_at?: string;

  /** The ID of the user associated with the persona */
  user_id?: string;

  /** Creation timestamp */
  created_at?: string;
}

/**
 * Persona API hook for managing persona operations
 */
const usePersonaApi = () => {
  /**
   * Get the currently activated persona
   */
  const getActivatePersona = (): Promise<R<Persona | null>> => {
    return fetch('/api/persona/activate', {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    }).then((res) => {
      return res.json();
    });
  };

  /**
   * Get list of all personas
   */
  const listPersonas = (): Promise<R<Persona[]>> => {
    return fetch('/api/persona/list', {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    }).then((res) => {
      return res.json();
    });
  };

  /**
   * Create a new persona
   */
  const createPersona = (persona: Omit<Persona, 'id' | 'created_at' | 'updated_at'>): Promise<R<Persona>> => {
    return fetch('/api/persona', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(persona),
    }).then((res) => {
      return res.json();
    });
  };

  /**
   * Update an existing persona
   */
  const updatePersona = (id: string, persona: Partial<Persona>): Promise<R<Persona>> => {
    return fetch(`/api/persona/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(persona),
    }).then((res) => {
      return res.json();
    });
  };

  /**
   * Delete a persona
   */
  const deletePersona = (id: string): Promise<R<boolean>> => {
    return fetch(`/api/persona/${id}`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
    }).then((res) => {
      return res.json();
    });
  };

  /**
   * Activate a specific persona
   */
  const activatePersona = (id: string): Promise<R<boolean>> => {
    return fetch(`/api/persona/${id}/activate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    }).then((res) => {
      return res.json();
    });
  };

  /**
   * Deactivate a specific persona
   */
  const deactivatePersona = (id: string): Promise<R<boolean>> => {
    return fetch(`/api/persona/${id}/deactivate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    }).then((res) => {
      return res.json();
    });
  };

  /**
   * Get a specific persona by ID
   */
  const getPersona = (id: string): Promise<R<Persona>> => {
    return fetch(`/api/persona/${id}`, {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    }).then((res) => {
      return res.json();
    });
  };

  /**
   * Upload persona thumbnail
   */
  const uploadPersonaThumb = (id: string, file: File): Promise<R<{ thumb_url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);

    return fetch(`/api/persona/${id}/thumb`, {
      method: 'POST',
      body: formData,
    }).then((res) => {
      return res.json();
    });
  };

  return {
    getActivatePersona,
    listPersonas,
    createPersona,
    updatePersona,
    deletePersona,
    activatePersona,
    deactivatePersona,
    getPersona,
    uploadPersonaThumb,
  };
};

export default usePersonaApi;