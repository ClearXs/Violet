'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import ContentSection from './components/content-section';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Star,
  Play,
  Pause,
  Edit,
  Trash2,
  Upload,
  Plus,
  User,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import usePersonaApi, { Persona } from '@/services/personas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

export type SettingsProfileProps = {};

const NoImageSkeleton = () => (
  <div className='w-full h-48 bg-gray-100 rounded-t-lg flex flex-col items-center justify-center space-y-2'>
    <div className='w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center animate-pulse'>
      <User className='w-8 h-8 text-gray-400' />
    </div>
    <span className='text-gray-400 text-sm font-medium'>No Avatar</span>
    <div className='flex space-x-1'>
      <div className='w-2 h-2 bg-gray-300 rounded-full animate-pulse'></div>
      <div className='w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-75'></div>
      <div className='w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-150'></div>
    </div>
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
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <Card
        className={`group overflow-hidden transition-all duration-300 hover:scale-105 ${
          isActive
            ? 'ring-2 ring-blue-500 shadow-lg bg-blue-50'
            : 'hover:shadow-lg bg-white'
        }`}
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
                src={persona.thumb}
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
          <h3
            className={`font-semibold line-clamp-2 mb-3 transition-colors ${
              isActive
                ? 'text-blue-700'
                : 'text-gray-900 group-hover:text-blue-600'
            }`}
          >
            {persona.name}
          </h3>

          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center space-x-2'>
              <Avatar className='w-6 h-6'>
                <AvatarFallback className='bg-blue-500 text-white text-xs'>
                  {persona.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className='text-sm text-gray-600'>
                {persona.user_id || 'System'}
              </span>
            </div>

            <span className='text-xs text-gray-500'>
              {persona.updated_at
                ? new Date(persona.updated_at).toLocaleDateString()
                : 'Unknown'}
            </span>
          </div>

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
              className='bg-red-500 hover:bg-red-600'
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
      const [personasRes, activeRes] = await Promise.all([
        personaApi.listPersonas(),
        personaApi.getActivatePersona(),
      ]);

      if (personasRes.code === 200) {
        setPersonas(personasRes.data);
      }

      if (activeRes.code === 200) {
        setActivePersona(activeRes.data);
      }
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
      <ContentSection
        title='Personas'
        desc='This is how others will see you on the site.'
      >
        <ScrollArea className='flex-1 -mx-1 px-3'>
          <div className='min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 p-6'>
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
      </ContentSection>
    );
  }

  return (
    <ContentSection
      title='Personas'
      desc='This is how others will see you on the site.'
    >
      <ScrollArea className='flex-1 -mx-1 px-3'>
        <div className='min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 p-6'>
          <div className='max-w-7xl mx-auto'>
            <div className='mb-8 flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                  Persona Gallery
                </h1>
                <p className='text-gray-600'>
                  Manage your AI personas • {personas.length} total •{' '}
                  {activePersona ? '1 active' : 'None active'}
                </p>
              </div>

              <Button className='bg-violet-600 hover:bg-violet-700'>
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
                <Button className='bg-violet-600 hover:bg-violet-700'>
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
    </ContentSection>
  );
}
