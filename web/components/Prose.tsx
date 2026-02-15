import DOMPurify from 'isomorphic-dompurify';
import { JSX } from 'react';

type ProseProps = {
  content: string;
} & JSX.IntrinsicElements['article'];

export default function Prose({ content }: ProseProps) {
  // Sanitize HTML to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(content);

  return (
    <article className="prose prose-lg">
      <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
    </article>
  );
}
