import type { CustomCodeSnippet } from '@ons-mierloos-theater/shared/db';

interface Props {
  snippets: CustomCodeSnippet[];
}

/**
 * Server component that injects custom code snippets into the <head>.
 * Parses each snippet to detect <script>, <style>, or other tags and renders
 * them with dangerouslySetInnerHTML so Next.js / React doesn't strip attributes.
 */
export function CodeSnippetInjection({ snippets }: Props) {
  return (
    <>
      {snippets.map((snippet) => {
        const html = snippet.html.trim();

        // Detect outer tag: <script ...> or <style ...>
        const scriptMatch = html.match(/^<script(\s[^>]*)?>?([\s\S]*?)<\/script>$/i);
        const styleMatch = html.match(/^<style(\s[^>]*)?>?([\s\S]*?)<\/style>$/i);

        if (scriptMatch) {
          const attrs = parseAttrs(scriptMatch[1] || '');
          const inner = scriptMatch[2] || '';
          return (
            <script
              key={snippet.id}
              {...attrs}
              dangerouslySetInnerHTML={{ __html: inner }}
            />
          );
        }

        if (styleMatch) {
          const attrs = parseAttrs(styleMatch[1] || '');
          const inner = styleMatch[2] || '';
          return (
            <style
              key={snippet.id}
              {...attrs}
              dangerouslySetInnerHTML={{ __html: inner }}
            />
          );
        }

        // Anything else (link, meta, etc.) — render as a fragment with
        // dangerouslySetInnerHTML inside a noscript wrapper is not ideal, so
        // use a div with hidden display; React supports dangerouslySetInnerHTML
        // on arbitrary elements in RSC context.
        // For head-safe tags like <link> and <meta> admins should use plain tags.
        // We render in a hidden span as a safe fallback.
        return (
          <span
            key={snippet.id}
            dangerouslySetInnerHTML={{ __html: html }}
            style={{ display: 'none' }}
          />
        );
      })}
    </>
  );
}

/**
 * Very lightweight attribute parser — handles common cases like
 * src="…", async, defer, type="text/javascript", nonce="…"
 */
function parseAttrs(attrsString: string): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  // Match key="value", key='value', or standalone key
  const re = /(\w[\w-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrsString)) !== null) {
    const key = m[1];
    const val = m[2] ?? m[3] ?? m[4];
    if (val === undefined) {
      result[key] = true;
    } else {
      result[key] = val;
    }
  }
  return result;
}
