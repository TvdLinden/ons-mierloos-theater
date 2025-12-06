import { marked } from 'marked';

type MarkdownProps = {
  content: string;
};

export default function Markdown({ content }: MarkdownProps) {
  const parsedMd = marked.parse(content);
  return (
    <article className="prose lg:prose-xl prose-slate dark:prose-invert">
      <div dangerouslySetInnerHTML={{ __html: parsedMd }} />
    </article>
  );
}
