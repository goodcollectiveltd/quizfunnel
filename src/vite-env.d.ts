/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_META_PIXEL_ID?: string;
  readonly VITE_GA4_ID?: string;
  readonly VITE_KLAVIYO_PUBLIC_KEY?: string;
  readonly VITE_KLAVIYO_LIST_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
