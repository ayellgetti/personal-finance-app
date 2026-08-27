/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OTP_AUTO_VERIFY?: string;
  readonly VITE_DEV_ALLOWED_HOSTS?: string;
  readonly VITE_DEV_POLLING?: string;
  readonly VITE_API_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __APP_CONFIG__?: { OTP_AUTO_VERIFY?: boolean | string };
}
