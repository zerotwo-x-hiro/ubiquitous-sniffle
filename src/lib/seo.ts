import { useEffect } from "react";

type MetaSpec = {
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article";
  url?: string;
};

const SITE_NAME = "KDramaWorld";
const DEFAULT_DESC = "KDramaWorld — A cinematic Korean drama discovery experience. Catalogues, ratings, posters and editorial picks, all sourced live.";
const DEFAULT_IMG = "/og-default.jpg";

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Update document <title> and primary Open Graph / Twitter Card meta tags
 *  when a page mounts. Restores defaults on unmount. Clients that don't run
 *  JS (crawlers, iMessage/Twitter/Discord link unfurling) will still see the
 *  static defaults from index.html; real SSR/prerender is planned for B4. */
export function useSeo({ title, description, image, type = "website", url }: MetaSpec) {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — Your World of Korean Dramas`;
    document.title = fullTitle;
    const desc = description || DEFAULT_DESC;
    const ogImg = image || DEFAULT_IMG;
    const fullUrl = url || (typeof window !== "undefined" ? window.location.href : undefined);

    setMeta("description", desc);
    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", desc, "property");
    setMeta("og:type", type, "property");
    setMeta("og:site_name", SITE_NAME, "property");
    if (ogImg) setMeta("og:image", ogImg.startsWith("http") ? ogImg : (typeof window !== "undefined" ? window.location.origin + ogImg : ogImg), "property");
    if (fullUrl) setMeta("og:url", fullUrl, "property");
    setMeta("twitter:card", image ? "summary_large_image" : "summary");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", desc);
    if (ogImg) setMeta("twitter:image", ogImg.startsWith("http") ? ogImg : (typeof window !== "undefined" ? window.location.origin + ogImg : ogImg));
  }, [title, description, image, type, url]);
}
