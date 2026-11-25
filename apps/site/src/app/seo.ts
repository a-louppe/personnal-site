import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SITE_ORIGIN } from './site-config';

/** Per-page head tags. Every call sets or removes all of them, so nothing leaks between routes. */
@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  /** A normal indexable page at `path` (for example "/"). */
  setPage(path: string): void {
    const url = `${SITE_ORIGIN}${path}`;
    this.setCanonical(url);
    this.meta.removeTag("name='robots'");
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: this.title.getTitle() });
  }

  /** A page that must stay out of search results and has no canonical URL. */
  setNoIndex(): void {
    this.setCanonical(null);
    this.meta.removeTag("property='og:url'");
    this.meta.removeTag("property='og:title'");
    this.meta.updateTag({ name: 'robots', content: 'noindex' });
  }

  private setCanonical(url: string | null): void {
    const head = this.document.head;
    const existing = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (url === null) {
      existing?.remove();
      return;
    }
    const link = existing ?? this.document.createElement('link');
    link.rel = 'canonical';
    link.href = url;
    if (!existing) head.appendChild(link);
  }
}
