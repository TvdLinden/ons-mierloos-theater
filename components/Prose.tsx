import { JSX } from 'react';

type ProseProps = {
  content: string;
} & JSX.IntrinsicElements['article'];

export default function Prose({ content }: ProseProps) {
  return (
    <article className="prose prose-lg text-center">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </article>
  );
}
