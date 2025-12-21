'use client';

import { useState, useTransition, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import WysiwygEditor, { type WysiwygEditorRef } from '@/components/WysiwygEditor';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, ImageIcon, X } from 'lucide-react';
import type { NewsArticle } from '@/lib/db';
import Image from 'next/image';
import {
  createNewsArticleAction,
  updateNewsArticleAction,
  deleteNewsArticleAction,
  toggleNewsArticleActiveAction,
} from './actions';

interface NewsArticlesListProps {
  articles: NewsArticle[];
  availableImages: Array<{ id: string; filename: string | null }>;
}

interface ArticleFormData {
  title: string;
  content: string;
  imageId: string | null;
  publishedAt: string;
  active: boolean;
}

export function NewsArticlesList({
  articles: initialArticles,
  availableImages,
}: NewsArticlesListProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [isPending, startTransition] = useTransition();
  const contentEditorRef = useRef<WysiwygEditorRef>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Add/Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    content: '',
    imageId: null,
    publishedAt: new Date().toISOString().slice(0, 16),
    active: true,
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<NewsArticle | null>(null);

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      imageId: null,
      publishedAt: new Date().toISOString().slice(0, 16),
      active: true,
    });
    setEditingArticle(null);
    setEditorKey((prev) => prev + 1);
  };

  const handleAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      imageId: article.imageId || null,
      publishedAt: article.publishedAt
        ? new Date(article.publishedAt).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      active: article.active === 1,
    });
    setEditorKey((prev) => prev + 1);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const content = contentEditorRef.current?.getMarkdown() || '';

    startTransition(async () => {
      try {
        if (editingArticle) {
          const result = await updateNewsArticleAction(editingArticle.id, {
            title: formData.title,
            content: content,
            imageId: formData.imageId,
            publishedAt: new Date(formData.publishedAt),
            active: formData.active ? 1 : 0,
          });
          if (result.success) {
            setArticles((prev) =>
              prev.map((a) =>
                a.id === editingArticle.id
                  ? {
                      ...a,
                      ...formData,
                      publishedAt: new Date(formData.publishedAt),
                      active: formData.active ? 1 : 0,
                    }
                  : a,
              ),
            );
            setDialogOpen(false);
            resetForm();
          }
        } else {
          const result = await createNewsArticleAction({
            title: formData.title,
            content: content,
            imageId: formData.imageId,
            publishedAt: new Date(formData.publishedAt),
            active: formData.active ? 1 : 0,
          });
          if (result.success && result.article) {
            setArticles((prev) => [result.article!, ...prev]);
            setDialogOpen(false);
            resetForm();
          }
        }
      } catch (error) {
        console.error('Error saving article:', error);
      }
    });
  };

  const handleDeleteClick = (article: NewsArticle) => {
    setArticleToDelete(article);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!articleToDelete) return;

    startTransition(async () => {
      try {
        const result = await deleteNewsArticleAction(articleToDelete.id);
        if (result.success) {
          setArticles((prev) => prev.filter((a) => a.id !== articleToDelete.id));
          setDeleteDialogOpen(false);
          setArticleToDelete(null);
        }
      } catch (error) {
        console.error('Error deleting article:', error);
      }
    });
  };

  const handleToggleActive = async (article: NewsArticle) => {
    startTransition(async () => {
      try {
        const result = await toggleNewsArticleActiveAction(
          article.id,
          article.active === 1 ? 0 : 1,
        );
        if (result.success) {
          setArticles((prev) =>
            prev.map((a) =>
              a.id === article.id ? { ...a, active: article.active === 1 ? 0 : 1 } : a,
            ),
          );
        }
      } catch (error) {
        console.error('Error toggling active status:', error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {articles.length} {articles.length === 1 ? 'artikel' : 'artikelen'}
        </p>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nieuw Artikel
        </Button>
      </div>

      {articles.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titel</TableHead>
                <TableHead>Publicatiedatum</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell>
                    {article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString('nl-NL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Niet gepubliceerd'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={article.active === 1 ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => handleToggleActive(article)}
                    >
                      {article.active === 1 ? 'Actief' : 'Inactief'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(article)}
                      disabled={isPending}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(article)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nog geen nieuws artikelen. Klik op &quot;Nieuw Artikel&quot; om er een toe te voegen.
        </p>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingArticle ? 'Artikel Bewerken' : 'Nieuw Artikel'}</DialogTitle>
              <DialogDescription>
                {editingArticle
                  ? 'Bewerk de details van het nieuws artikel'
                  : 'Voeg een nieuw nieuws artikel toe aan de homepagina'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label htmlFor="title" className="text-sm font-medium">
                  Titel
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nieuws artikel titel"
                  required
                />
              </div>
              <div>
                <label htmlFor="content" className="text-sm font-medium">
                  Inhoud
                </label>
                <WysiwygEditor
                  key={editorKey}
                  name="content"
                  defaultValue={formData.content}
                  placeholder="Artikel inhoud..."
                  ref={contentEditorRef}
                />
              </div>
              <div>
                <label htmlFor="image" className="text-sm font-medium block mb-2">
                  Afbeelding (optioneel)
                </label>
                {formData.imageId ? (
                  <div className="relative inline-block">
                    <div className="relative w-32 h-32 border rounded">
                      <Image
                        src={`/api/images/${formData.imageId}`}
                        alt="Geselecteerde afbeelding"
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2"
                      onClick={() => setFormData({ ...formData, imageId: null })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowImagePicker(true)}
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Selecteer Afbeelding
                    </Button>
                    {showImagePicker && (
                      <div className="mt-4 border rounded-lg p-4 max-h-64 overflow-y-auto">
                        <div className="grid grid-cols-4 gap-2">
                          {availableImages.map((img) => (
                            <button
                              key={img.id}
                              type="button"
                              className="relative aspect-square border rounded hover:border-primary"
                              onClick={() => {
                                setFormData({ ...formData, imageId: img.id });
                                setShowImagePicker(false);
                              }}
                            >
                              <Image
                                src={`/api/images/${img.id}`}
                                alt={img.filename || 'Afbeelding'}
                                fill
                                className="object-cover rounded"
                              />
                            </button>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => setShowImagePicker(false)}
                        >
                          Annuleren
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="publishedAt" className="text-sm font-medium">
                  Publicatiedatum
                </label>
                <Input
                  id="publishedAt"
                  type="datetime-local"
                  value={formData.publishedAt}
                  onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="active" className="text-sm font-medium">
                  Direct publiceren (actief)
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
                disabled={isPending}
              >
                Annuleren
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Bezig...' : editingArticle ? 'Opslaan' : 'Toevoegen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
            <AlertDialogDescription>
              Dit artikel &quot;{articleToDelete?.title}&quot; wordt permanent verwijderd. Deze
              actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isPending}>
              {isPending ? 'Bezig...' : 'Verwijderen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
