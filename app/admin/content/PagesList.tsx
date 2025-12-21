'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus } from 'lucide-react';
import type { Page } from '@/lib/db';
import { updatePageAction } from './actions';

interface PagesListProps {
  pages: Page[];
}

export function PagesList({ pages }: PagesListProps) {
  const [isPending, startTransition] = useTransition();

  const togglePageStatus = (page: Page) => {
    const targetStatus = page.status === 'published' ? 'draft' : 'published';
    startTransition(async () => {
      await updatePageAction(page.id, {
        status: targetStatus as Page['status'],
        updatedAt: new Date(),
      });
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href="/admin/pages/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe pagina toevoegen
          </Button>
        </Link>
      </div>

      {pages.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          Er zijn geen pagina's gevonden.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titel</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aangemaakt</TableHead>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => {
              const isPublished = page.status === 'published';
              const actionLabel = isPublished ? 'Maak concept' : 'Publiceer';
              const createdAt = page.createdAt
                ? new Date(page.createdAt).toLocaleDateString('nl-NL')
                : '-';

              return (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{page.slug}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-sm font-semibold ${isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                    >
                      {isPublished ? 'Gepubliceerd' : 'Concept'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{createdAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Link href={`/admin/pages/edit/${page.id}`}>
                        <Button variant="default" size="sm" disabled={isPending}>
                          Bewerk
                        </Button>
                      </Link>
                      <Link
                        href={`/admin/pages/preview/${page.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button variant="ghost" size="sm" disabled={isPending}>
                          Bekijk
                        </Button>
                      </Link>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => togglePageStatus(page)}
                        disabled={isPending}
                      >
                        {actionLabel}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
