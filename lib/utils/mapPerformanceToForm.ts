import { ShowFormState } from '@/components/ShowForm';
import { Show } from '../db';

export function mapPerformanceToForm(show: Show): ShowFormState {
  return {
    title: show.title ?? '',
    subtitle: show.subtitle ?? '',
    slug: show.slug ?? '',
    description: show.description ?? '',
    imageId: show.imageId ?? '',
    thumbnailImageId: show.thumbnailImageId ?? '',
    price: '',
    status: show.status,
    publicationDate: show.publicationDate
      ? new Date(show.publicationDate).toISOString().slice(0, 16)
      : '',
    depublicationDate: show.depublicationDate
      ? new Date(show.depublicationDate).toISOString().slice(0, 16)
      : '',
    performances: [],
  };
}
