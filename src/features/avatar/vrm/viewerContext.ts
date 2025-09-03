import { createContext, useContext } from 'react';
import { Viewer } from './viewer';

const viewer = new Viewer();

export const ViewerContext = createContext({ viewer });

export const useViewer = () => {
  const context = useContext(ViewerContext);
  if (!context) {
    throw new Error('useViewer must be used within a ViewerProvider');
  }
  return context.viewer;
};
