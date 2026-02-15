import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { JSX } from 'react';

type MarkdownProps = {
  content: string;
} & JSX.IntrinsicElements['article'];

export default function Markdown({ content, ...props }: MarkdownProps) {
  const parsedMd = marked.parse(content) as string;
  const sanitizedContent = DOMPurify.sanitize(parsedMd);
  return (
    <article className="prose lg:prose-xl prose-slate dark:prose-invert" {...props}>
      <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
    </article>
  );
}
