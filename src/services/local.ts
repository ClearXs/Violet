const useLocalApi = () => {
  const join = (...paths: string[]): Promise<string> => {
    return fetch('/api/path/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths }),
    }).then((response) => response.text());
  };

  return { join };
};

export default useLocalApi;
