/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_URL?: string;
  readonly VITE_DEV_ALLOWED_HOSTS?: string;
  readonly VITE_DEV_POLLING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
