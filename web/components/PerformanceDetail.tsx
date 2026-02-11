import { ShowWithTagsAndPerformances } from '@ons-mierloos-theater/shared/db';
import { BlockRenderer } from './BlockRenderer';
import { BlocksArray } from '@ons-mierloos-theater/shared/schemas/blocks';

export type ShowDetailProps = {
  show: ShowWithTagsAndPerformances;
  children?: React.ReactNode;
};

export default function ShowDetail({ show, children }: ShowDetailProps) {
  const { blocks } = show;

  return (
    <div className="w-full">
      <BlockRenderer blocks={blocks as BlocksArray} />
      {children}
    </div>
  );
}
