'use client';

import { Button } from '@/components/ui/button';
import useSceneApi, { Scene } from '@/services/scene';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

export default function SceneDetails({
  params,
}: {
  params: Promise<{ idx: string }>;
}) {
  const { idx } = use(params);
  const sceneApi = useSceneApi();

  const router = useRouter();

  const [scene, setScene] = useState<Scene>();

  useEffect(() => {
    sceneApi.getSceneById(idx!).then((data) => {
      setScene(data);
    });
  }, [idx]);

  return (
    <div>
      <header>
        <Button size='icon' onClick={() => router.back()}>
          <IconArrowLeft />
        </Button>
      </header>
    </div>
  );
  return <></>;
}
