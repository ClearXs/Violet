'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus, FileText, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import useSceneApi, { Scene } from '@/services/scene';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { useLayout } from '@/context/layout-context';
import { toast } from 'sonner';

export type SettingsSceneProps = {};

const NoImageSkeleton = () => (
  <div className='w-full h-48 bg-gray-100 rounded-t-lg flex flex-col items-center justify-center space-y-2'>
    <div className='w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center animate-pulse'>
      <FileText className='w-8 h-8 text-gray-400' />
    </div>
    <span className='text-gray-400 text-sm font-medium'>No Preview</span>
  </div>
);

const SceneCard = ({
  scene,
  onEdit,
  onDelete,
  onView,
}: {
  scene: Scene;
  onEdit: (scene: Scene) => void;
  onDelete: (id: string) => void;
  onView: (scene: Scene) => void;
}) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const layout = useLayout();

  // Get file extension for badge
  const getFileExtension = (filename: string) => {
    const extension = filename.split('.').pop()?.toUpperCase();
    return extension || 'FILE';
  };

  return (
    <>
      <Card
        className={`group overflow-hidden transition-all duration-300 hover:scale-105 py-0 gap-2 cursor-pointer`}
        onClick={(e) => {
          // Prevent card click when clicking action buttons
          if (!(e.target as HTMLElement).closest('button')) {
            onView(scene);
          }
        }}
      >
        <div className='relative'>
          {!scene.thumb || imageError ? (
            <NoImageSkeleton />
          ) : (
            <div className='relative w-full h-48 overflow-hidden'>
              {imageLoading && (
                <Skeleton className='absolute inset-0 w-full h-full' />
              )}
              <Image
                src={`/api/file/download_image?path=${scene.thumb}`}
                alt={scene.name}
                fill
                className={`object-cover transition-opacity duration-300 ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
            </div>
          )}

          {/* File Type Badge */}
          <Badge
            className={`absolute top-3 left-3 border-none bg-blue-500 text-white`}
          >
            {getFileExtension(scene.main_file)}
          </Badge>

          {/* Action Buttons */}
          <div className='absolute top-3 right-3 flex space-x-1'>
            <Button
              size='sm'
              variant='secondary'
              className='p-2 bg-white/80 backdrop-blur-sm hover:bg-white'
              onClick={(e) => {
                e.stopPropagation();
                onView(scene);
              }}
            >
              <Eye className='w-4 h-4' />
            </Button>
            <Button
              size='sm'
              variant='secondary'
              className='p-2 bg-white/80 backdrop-blur-sm hover:bg-white'
              onClick={(e) => {
                e.stopPropagation();
                onEdit(scene);
              }}
            >
              <Edit className='w-4 h-4' />
            </Button>
            <Button
              size='sm'
              variant='secondary'
              className='p-2 bg-white/80 backdrop-blur-sm hover:bg-white'
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
            >
              <Trash2 className='w-4 h-4 text-red-500' />
            </Button>
          </div>
        </div>

        <CardContent className='p-4'>
          <h3 className={`font-semibold line-clamp-2 mb-2 transition-colors`}>
            {scene.name}
          </h3>

          {scene.description && (
            <p className='text-sm text-gray-600 line-clamp-2 mb-3'>
              {scene.description}
            </p>
          )}

          <div className='flex items-center justify-between text-xs text-gray-500'>
            <span className='truncate'>{scene.main_file}</span>
            {scene.updated_at && (
              <span>{new Date(scene.updated_at).toLocaleDateString()}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scene</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete '{scene.name}'? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(scene.id!);
                setShowDeleteDialog(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default function SettingsScenes({ config }: SettingsSceneProps) {
  const sceneApi = useSceneApi();

  const router = useRouter();

  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);

  // Load scenes
  const loadScenes = async () => {
    try {
      setLoading(true);
      const scenesList = await sceneApi.listScenes();
      setScenes(scenesList);
    } catch (error) {
      toast.error(`Failed to load scenes. ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScenes();
  }, []);

  const handleView = (scene: Scene) => {
    router.push(`/scenes/${scene.id}`);
  };

  const handleEdit = (scene: Scene) => {
    setEditingScene(scene);
    // TODO: Open edit dialog/modal
    toast.info(`Edit functionality for "${scene.name}" coming soon.`);
  };

  const handleDelete = async (id: string) => {
    try {
      await sceneApi.deleteScene(id);
      setScenes(scenes.filter((s) => s.id !== id));
      toast.success('Scene deleted successfully.');
    } catch (error) {
      toast.error(`Failed to delete scene. ${error}`);
    }
  };

  const handleCreateScene = () => {
    // TODO: Open create scene dialog/modal
    toast.info('Create scene functionality coming soon.');
  };

  if (loading) {
    return (
      <ScrollArea className='flex-1 -mx-1 px-3'>
        <div className='min-h-screen p-6'>
          <div className='max-w-7xl mx-auto'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className='overflow-hidden'>
                  <Skeleton className='w-full h-48' />
                  <CardContent className='p-4'>
                    <Skeleton className='h-4 w-3/4 mb-2' />
                    <Skeleton className='h-3 w-1/2' />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className='flex-1 -mx-1 px-3'>
      <div className='min-h-screen p-2'>
        <div className='mx-auto'>
          <div className='mb-8 flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>Scenes</h1>
              <p className='text-gray-600'>
                Manage your 3D scenes • {scenes.length} total
              </p>
            </div>

            <Button onClick={handleCreateScene}>
              <Plus className='w-4 h-4 mr-2' />
              Create Scene
            </Button>
          </div>

          {scenes.length === 0 ? (
            <div className='text-center py-12'>
              <FileText className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                No Scenes Found
              </h3>
              <p className='text-gray-600 mb-4'>
                Create your first scene to get started.
              </p>
              <Button onClick={handleCreateScene}>
                <Plus className='w-4 h-4 mr-2' />
                Create First Scene
              </Button>
            </div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {scenes.map((scene) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
