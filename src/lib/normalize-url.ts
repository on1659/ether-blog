/**
 * URL 정규화 유틸리티
 * 쿼리스트링, trailing slash, fragment 제거하여 중복 비교용 정규 URL 생성
 */
export const normalizeUrl = (rawUrl: string): string => {
  try {
    const url = new URL(rawUrl);
    // 쿼리스트링 중 추적 파라미터 제거
    const trackingParams = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref", "source"];
    trackingParams.forEach((p) => url.searchParams.delete(p));
    // trailing slash 제거
    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    return `${url.origin}${pathname}${url.search}`;
  } catch {
    return rawUrl;
  }
};

/**
 * 소스별 canonical URL 추출
 * HN: item.url이 있으면 원문 URL 반환 (없으면 HN 자체 URL)
 * Reddit: permalink → 원문 URL이 있으면 원문 반환
 * HuggingFace: arxiv URL 추출 가능
 */
export const extractCanonicalUrl = (url: string, source: string): string | null => {
  // Reddit permalink → canonical 추출 불가 (별도 API 필요)
  if (source.startsWith("Reddit") && url.includes("reddit.com")) {
    return null;
  }
  // HN 자체 URL → canonical 없음
  if (url.includes("news.ycombinator.com/item")) {
    return null;
  }
  // 그 외: URL 자체가 canonical
  return normalizeUrl(url);
};

/**
 * externalId 생성: "${source}::${normalizedUrl}"
 */
export const makeExternalId = (source: string, url: string): string => {
  return `${source}::${normalizeUrl(url)}`;
};
