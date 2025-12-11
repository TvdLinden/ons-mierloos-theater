'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit, ChevronUp, ChevronDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Badge } from '@/components/ui/badge';
import type { NavigationLink, LinkLocation } from '@/lib/db';
import {
  deleteNavigationLinkAction,
  createNavigationLinkAction,
  updateNavigationLinkAction,
} from './actions';
import { useRouter } from 'next/navigation';

type NavigationLinksListProps = {
  links: NavigationLink[];
  location: LinkLocation;
};

export function NavigationLinksList({ links, location }: NavigationLinksListProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<NavigationLink | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState({ label: '', href: '' });
  const [editForm, setEditForm] = useState({ label: '', href: '', active: 1 });

  const handleDelete = (id: string) => {
    setLinkToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (link: NavigationLink) => {
    setEditingLink(link);
    setEditForm({
      label: link.label,
      href: link.href,
      active: link.active,
    });
    setEditDialogOpen(true);
  };

  const confirmEdit = async () => {
    if (!editingLink) return;
    await updateNavigationLinkAction(editingLink.id, editForm);
    setEditDialogOpen(false);
    setEditingLink(null);
    router.refresh();
  };

  const handleMove = async (linkId: string, direction: 'up' | 'down') => {
    const sortedLinks = [...links].sort((a, b) => a.displayOrder - b.displayOrder);
    const currentIndex = sortedLinks.findIndex((l) => l.id === linkId);

    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === sortedLinks.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentLink = sortedLinks[currentIndex];
    const targetLink = sortedLinks[targetIndex];

    // Swap display orders
    await Promise.all([
      updateNavigationLinkAction(currentLink.id, { displayOrder: targetLink.displayOrder }),
      updateNavigationLinkAction(targetLink.id, { displayOrder: currentLink.displayOrder }),
    ]);

    router.refresh();
  };

  const toggleActive = async (link: NavigationLink) => {
    await updateNavigationLinkAction(link.id, { active: link.active ? 0 : 1 });
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!linkToDelete) return;
    await deleteNavigationLinkAction(linkToDelete);
    setDeleteDialogOpen(false);
    setLinkToDelete(null);
    router.refresh();
  };

  const handleAdd = async () => {
    if (!newLink.label || !newLink.href) return;

    const maxOrder = links.reduce((max, link) => Math.max(max, link.displayOrder), 0);

    await createNavigationLinkAction({
      label: newLink.label,
      href: newLink.href,
      location,
      displayOrder: maxOrder + 1,
      active: 1,
    });

    setNewLink({ label: '', href: '' });
    setShowAddForm(false);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen links gevonden</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Volgorde</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...links]
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((link, index) => (
                <TableRow key={link.id}>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMove(link.id, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMove(link.id, 'down')}
                        disabled={index === links.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{link.label}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{link.href}</TableCell>
                  <TableCell>
                    <Badge
                      variant={link.active ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => toggleActive(link)}
                    >
                      {link.active ? 'Actief' : 'Inactief'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(link)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(link.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      )}

      {showAddForm ? (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Label</label>
              <Input
                value={newLink.label}
                onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                placeholder="Bijv. Contact"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">URL</label>
              <Input
                value={newLink.href}
                onChange={(e) => setNewLink({ ...newLink, href: e.target.value })}
                placeholder="Bijv. /contact"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd}>Toevoegen</Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Annuleren
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setShowAddForm(true)} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Link Toevoegen
        </Button>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Bewerken</DialogTitle>
            <DialogDescription>Wijzig de label en URL van de navigatie link</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Label</label>
              <Input
                value={editForm.label}
                onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                placeholder="Bijv. Contact"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">URL</label>
              <Input
                value={editForm.href}
                onChange={(e) => setEditForm({ ...editForm, href: e.target.value })}
                placeholder="Bijv. /contact"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={editForm.active === 1}
                onChange={(e) => setEditForm({ ...editForm, active: e.target.checked ? 1 : 0 })}
                className="h-4 w-4"
              />
              <label htmlFor="edit-active" className="text-sm font-medium">
                Actief
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={confirmEdit}>Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Link verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je deze link wilt verwijderen? Deze actie kan niet ongedaan worden
              gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Verwijderen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
