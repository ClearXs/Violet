'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, Edit, Trash2, Plus, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import usePersonaApi, { Persona } from '@/services/personas';
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

export type SettingsProfileProps = {};

const NoImageSkeleton = () => (
  <div className='w-full h-48 bg-gray-100 rounded-t-lg flex flex-col items-center justify-center space-y-2'>
    <div className='w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center animate-pulse'>
      <User className='w-8 h-8 text-gray-400' />
    </div>
    <span className='text-gray-400 text-sm font-medium'>No Avatar</span>
  </div>
);

const PersonaCard = ({
  persona,
  isActive,
  onActivate,
  onEdit,
  onDelete,
}: {
  persona: Persona;
  isActive: boolean;
  onActivate: (id: string) => void;
  onEdit: (persona: Persona) => void;
  onDelete: (id: string) => void;
}) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const layout = useLayout();

  return (
    <>
      <Card
        className={`group overflow-hidden transition-all duration-300 hover:scale-105 py-0 gap-2`}
        onClick={() => {
          layout.hide();
          router.push(`/personas/${persona.id}`);
        }}
      >
        <div className='relative'>
          {!persona.thumb || imageError ? (
            <NoImageSkeleton />
          ) : (
            <div className='relative w-full h-48 overflow-hidden'>
              {imageLoading && (
                <Skeleton className='absolute inset-0 w-full h-full' />
              )}
              <Image
                src={`/api/file/download_image?path=${persona.thumb}`}
                alt={persona.name}
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

          {/* Status Badge */}
          <Badge
            className={`absolute top-3 left-3 border-none ${
              isActive
                ? 'bg-green-500 text-white'
                : persona.activated
                ? 'bg-blue-500 text-white'
                : 'bg-gray-500 text-white'
            }`}
          >
            {isActive ? 'Active' : persona.activated ? 'Available' : 'Inactive'}
          </Badge>

          {/* Action Buttons */}
          <div className='absolute top-3 right-3 flex space-x-1'>
            <Button
              size='sm'
              variant='secondary'
              className='p-2 bg-white/80 backdrop-blur-sm hover:bg-white'
              onClick={() => onEdit(persona)}
            >
              <Edit className='w-4 h-4' />
            </Button>
            <Button
              size='sm'
              variant='secondary'
              className='p-2 bg-white/80 backdrop-blur-sm hover:bg-white'
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className='w-4 h-4 text-red-500' />
            </Button>
          </div>
        </div>

        <CardContent className='p-4'>
          <h3 className={`font-semibold line-clamp-2 mb-3 transition-colors`}>
            {persona.name}
          </h3>
          <div className='flex space-x-2'>
            <Button
              size='sm'
              className={`flex-1 ${
                isActive
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              onClick={() => onActivate(persona.id!)}
              disabled={!persona.activated && !isActive}
            >
              {isActive ? (
                <>
                  <Pause className='w-4 h-4 mr-1' />
                  Deactivate
                </>
              ) : (
                <>
                  <Play className='w-4 h-4 mr-1' />
                  Activate
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Persona</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{persona.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(persona.id!);
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

export default function SettingsPersonas({ config }: SettingsProfileProps) {
  const personaApi = usePersonaApi();
  const { toast } = useToast();

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [activePersona, setActivePersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

  // Load personas and active persona
  const loadPersonas = async () => {
    try {
      setLoading(true);
      const [personasList, activePersona] = await Promise.all([
        personaApi.listPersonas(),
        personaApi.getActivatePersona(),
      ]);

      setPersonas(personasList);
      setActivePersona(activePersona);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load personas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersonas();
  }, []);

  const handleActivate = async (id: string) => {
    try {
      const isCurrentlyActive = activePersona?.id === id;

      if (isCurrentlyActive) {
        // Deactivate current persona
        await personaApi.deactivatePersona(id);
        setActivePersona(null);
        toast({
          title: 'Success',
          description: 'Persona deactivated successfully.',
        });
      } else {
        // Activate new persona
        await personaApi.activatePersona(id);
        const newActive = personas.find((p) => p.id === id);
        setActivePersona(newActive || null);
        toast({
          title: 'Success',
          description: 'Persona activated successfully.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update persona status.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (persona: Persona) => {
    setEditingPersona(persona);
    // TODO: Open edit dialog/modal
    toast({
      title: 'Info',
      description: `Edit functionality for "${persona.name}" coming soon.`,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await personaApi.deletePersona(id);
      setPersonas(personas.filter((p) => p.id !== id));

      if (activePersona?.id === id) {
        setActivePersona(null);
      }

      toast({
        title: 'Success',
        description: 'Persona deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete persona.',
        variant: 'destructive',
      });
    }
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
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                Personas
              </h1>
              <p className='text-gray-600'>
                Manage your AI personas • {personas.length} total •{' '}
                {activePersona ? '1 active' : 'None active'}
              </p>
            </div>

            <Button>
              <Plus className='w-4 h-4 mr-2' />
              Create Persona
            </Button>
          </div>

          {personas.length === 0 ? (
            <div className='text-center py-12'>
              <User className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                No Personas Found
              </h3>
              <p className='text-gray-600 mb-4'>
                Create your first persona to get started.
              </p>
              <Button>
                <Plus className='w-4 h-4 mr-2' />
                Create First Persona
              </Button>
            </div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {personas.map((persona) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  isActive={activePersona?.id === persona.id}
                  onActivate={handleActivate}
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
