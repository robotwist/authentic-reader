// Type definitions for environment variables in window.env
interface Window {
  env?: {
    REACT_APP_HF_API_TOKEN?: string;
    REACT_APP_LOG_LEVEL?: string;
    [key: string]: string | undefined;
  };
} 