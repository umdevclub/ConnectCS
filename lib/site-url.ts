const ensureProtocol = (url: string) => {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
};

export const getSiteUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return ensureProtocol(process.env.NEXT_PUBLIC_SITE_URL);
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
};

export const getSiteUrlWithPath = (path: string) =>
  new URL(path, getSiteUrl()).toString();
