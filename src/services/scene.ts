/**
 * Scene interface matching the Python Pydantic model
 */
export interface Scene {
  /** Unique identifier for the scene */
  id?: string;

  /** The name of the scene */
  name: string;

  /** Description of the scene */
  description?: string;

  /** Scene assets relative path */
  r_path: string;

  /** Scene main file */
  main_file: string;

  /** Thumbnail image path for scene */
  thumb?: string;

  /** The last update timestamp of the scene */
  updated_at?: string;

  /** The ID of the user associated with the scene */
  user_id?: string;

  /** Creation timestamp */
  created_at?: string;
}

/**
 * Scene creation data interface
 */
export interface SceneCreateData {
  name: string;
  description?: string;
  main_file: string;
  r_path: string;
  thumb?: string;
}

/**
 * Scene update data interface
 */
export interface SceneUpdateData {
  id: string;
  name: string;
  description?: string;
  main_file: string;
  r_path: string;
  thumb?: string;
}

/**
 * Scene upsert data interface
 */
export interface SceneUpsertData {
  name: string;
  main_file: string;
  r_path: string;
  description?: string;
  thumb?: string;
}

/**
 * Scene API hook for managing scene operations
 */
const useSceneApi = () => {
  /**
   * Get list of all scenes
   */
  const listScenes = (after?: string, limit: number = 50): Promise<Scene[]> => {
    const params = new URLSearchParams();
    if (after) params.append('after', after);
    params.append('limit', limit.toString());

    return fetch(`/api/scene/list?${params}`, {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    }).then((res) => {
      return res.json();
    });
  };

  /**
   * Get a specific scene by ID
   */
  const getSceneById = (id: string): Promise<Scene> => {
    return fetch(`/api/scene/get_by_id/${id}`, {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    }).then((res) => {
      if (!res.ok) {
        throw new Error('Scene not found');
      }
      return res.json();
    });
  };

  /**
   * Create a new scene
   */
  const createScene = (sceneData: SceneCreateData): Promise<Scene> => {
    return fetch('/api/scene/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sceneData),
    }).then((res) => {
      return res.json();
    });
  };

  /**
   * Insert or update a scene
   */
  const upsertScene = (sceneData: SceneUpsertData): Promise<Scene> => {
    const params = new URLSearchParams();
    params.append('name', sceneData.name);
    params.append('main_file', sceneData.main_file);
    params.append('r_path', sceneData.r_path);
    if (sceneData.description)
      params.append('description', sceneData.description);
    if (sceneData.thumb) params.append('thumb', sceneData.thumb);

    return fetch(`/api/scene/upsert?${params}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    }).then((res) => {
      return res.json();
    });
  };

  /**
   * Update an existing scene
   */
  const updateScene = (
    id: string,
    sceneData: Partial<SceneUpdateData>
  ): Promise<Scene> => {
    return fetch(`/api/scene/update/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, ...sceneData }),
    }).then((res) => {
      return res.json();
    });
  };

  /**
   * Delete a scene
   */
  const deleteScene = (id: string): Promise<{ message: string }> => {
    return fetch(`/api/scene/delete/${id}`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
    }).then((res) => {
      return res.json();
    });
  };

  /**
   * Upload thumbnail for a scene
   */
  const uploadThumbnail = (
    sceneId: string,
    file: File
  ): Promise<{
    message: string;
    filename: string;
    thumbnail_path: string;
    scene: Scene;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('scene_id', sceneId);

    return fetch('/api/scene/upload_thumbnail', {
      method: 'POST',
      body: formData,
    }).then((res) => {
      if (!res.ok) {
        throw new Error('Upload failed');
      }
      return res.json();
    });
  };

  return {
    listScenes,
    getSceneById,
    createScene,
    upsertScene,
    updateScene,
    deleteScene,
    uploadThumbnail,
  };
};

export default useSceneApi;
