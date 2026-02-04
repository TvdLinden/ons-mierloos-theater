import { marked } from 'marked';
import { JSX } from 'react';

type MarkdownProps = {
  content: string;
} & JSX.IntrinsicElements['article'];

export default function Markdown({ content, ...props }: MarkdownProps) {
  const parsedMd = marked.parse(content);
  return (
    <article className="prose lg:prose-xl prose-slate dark:prose-invert" {...props}>
      <div dangerouslySetInnerHTML={{ __html: parsedMd }} />
    </article>
  );
}
