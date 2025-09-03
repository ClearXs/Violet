'use client';

import { useLayout } from '@/context/layout-context';
import { useEffect } from 'react';

export default function PersonaStageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const layout = useLayout();

  useEffect(() => {
    layout.hide();
  }, []);

  return <>{children}</>;
}
