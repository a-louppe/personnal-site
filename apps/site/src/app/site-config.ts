import config from '../../site.config.json';

/** Production origin without a trailing slash. Edit apps/site/site.config.json, not this file. */
export const SITE_ORIGIN: string = config.origin.replace(/\/$/, '');
