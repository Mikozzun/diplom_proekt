import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export const renderMarkdown = (content: string): string => {
  const rawHtml = marked.parse(content, { async: false }) as string;

  return sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img',
      'details',
      'summary',
      'del',
      'ins',
      'sup',
      'sub',
      'mark',
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'title', 'width', 'height'],
      a: ['href', 'title', 'target', 'rel'],
      code: ['class'],
      span: ['class'],
    },
    allowedSchemes: ['http', 'https'],
  });
};
