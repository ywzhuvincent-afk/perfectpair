import { promises as dns } from "node:dns";
import net from "node:net";

export type OperatorProductDraft = {
  sourceUrl: string;
  brand?: string;
  name?: string;
  material: string[];
  sizeRange?: string;
  productIdentifier?: string;
  categoryHint?: "bra" | "tights" | "leggings" | "jeans";
  denierHint?: number;
  warnings: string[];
};

const maxHtmlBytes = 550_000;
const blockedHostSuffixes = [".local", ".internal"];

class ProductDraftError extends Error {}

function trimText(value: unknown, max = 180) {
  if (typeof value !== "string") return undefined;
  const cleaned = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned ? cleaned.slice(0, max) : undefined;
}

function isPrivateAddress(address: string): boolean {
  const family = net.isIP(address);
  if (family === 4) {
    const [first, second] = address.split(".").map(Number);
    return first === 0 || first === 10 || first === 127 || first >= 224 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 198 && (second === 18 || second === 19));
  }
  if (family === 6) {
    const normalised = address.toLowerCase();
    if (normalised === "::" || normalised === "::1" || normalised.startsWith("fc") || normalised.startsWith("fd") || normalised.startsWith("fe8") || normalised.startsWith("fe9") || normalised.startsWith("fea") || normalised.startsWith("feb")) return true;
    const embeddedIpv4 = normalised.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
    return embeddedIpv4 ? isPrivateAddress(embeddedIpv4) : false;
  }
  return true;
}

async function validatePublicSourceUrl(input: string) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new ProductDraftError("请输入有效的 HTTPS 产品链接。");
  }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || host === "localhost" || blockedHostSuffixes.some((suffix) => host.endsWith(suffix))) {
    throw new ProductDraftError("该链接不符合安全要求；请使用公开的 HTTPS 产品页面。");
  }
  if (net.isIP(host)) {
    if (isPrivateAddress(host)) throw new ProductDraftError("该链接不符合安全要求；请使用公开的 HTTPS 产品页面。");
    return url;
  }
  try {
    const addresses = await dns.lookup(host, { all: true, verbatim: true });
    if (!addresses.length || addresses.some((entry) => isPrivateAddress(entry.address))) {
      throw new ProductDraftError("该链接不符合安全要求；请使用公开的 HTTPS 产品页面。");
    }
  } catch (error) {
    if (error instanceof ProductDraftError) throw error;
    throw new ProductDraftError("无法验证该网站地址，请检查链接后重试。");
  }
  return url;
}

async function readLimitedText(response: Response) {
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > maxHtmlBytes) throw new ProductDraftError("产品页面过大，无法安全读取。请改用更直接的产品页。");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxHtmlBytes) {
        await reader.cancel();
        throw new ProductDraftError("产品页面过大，无法安全读取。请改用更直接的产品页。");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

function attribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
  return match?.[2];
}

function metaContent(html: string, target: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const key = attribute(tag, "property") ?? attribute(tag, "name");
    if (key?.toLowerCase() === target.toLowerCase()) return trimText(attribute(tag, "content"));
  }
  return undefined;
}

function titleContent(html: string) {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return trimText(match?.[1]);
}

function isProduct(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const type = (value as Record<string, unknown>)["@type"];
  return typeof type === "string" ? type.toLowerCase() === "product" : Array.isArray(type) && type.some((entry) => typeof entry === "string" && entry.toLowerCase() === "product");
}

function findProduct(value: unknown): Record<string, unknown> | undefined {
  if (isProduct(value)) return value;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findProduct(entry);
      if (found) return found;
    }
  }
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    if (object["@graph"]) return findProduct(object["@graph"]);
  }
  return undefined;
}

function structuredProducts(html: string) {
  const scripts = html.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) ?? [];
  const records: Record<string, unknown>[] = [];
  for (const script of scripts) {
    const openingTag = script.match(/^<script\b[^>]*>/i)?.[0] ?? "";
    if (attribute(openingTag, "type")?.toLowerCase() !== "application/ld+json") continue;
    const json = script.replace(/^<script\b[^>]*>/i, "").replace(/<\/script>$/i, "").trim().replace(/^<!--|-->$/g, "");
    try {
      const product = findProduct(JSON.parse(json));
      if (product) records.push(product);
    } catch {
      // A malformed metadata block is ignored. We never execute page scripts.
    }
  }
  return records;
}

function textList(value: unknown) {
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.map((entry) => trimText(entry, 80)).filter((entry): entry is string => Boolean(entry)))].slice(0, 12);
}

function namedValue(value: unknown) {
  if (typeof value === "string") return trimText(value, 120);
  if (value && typeof value === "object" && !Array.isArray(value)) return trimText((value as Record<string, unknown>).name, 120);
  return undefined;
}

function additionalValue(product: Record<string, unknown>, names: string[]) {
  const properties = Array.isArray(product.additionalProperty) ? product.additionalProperty : [product.additionalProperty];
  for (const property of properties) {
    if (!property || typeof property !== "object" || Array.isArray(property)) continue;
    const record = property as Record<string, unknown>;
    const name = trimText(record.name)?.toLowerCase();
    if (!name || !names.some((candidate) => name.includes(candidate))) continue;
    const value = trimText(record.value ?? record.valueReference, 120);
    if (value) return value;
  }
  return undefined;
}

function inferCategory(...values: Array<unknown>) {
  const content = values.map((entry) => typeof entry === "string" ? entry : "").join(" ").toLowerCase();
  if (/\b(bra|bralette|lingerie|underwire)\b/.test(content)) return "bra" as const;
  if (/\b(tight|pantyhose|hosiery|stocking)\b/.test(content)) return "tights" as const;
  if (/\b(legging|activewear|athletic tight)\b/.test(content)) return "leggings" as const;
  if (/\b(jean|denim)\b/.test(content)) return "jeans" as const;
  return undefined;
}

function numberHint(value: string | undefined) {
  const number = Number(value?.match(/\b(\d{1,3})\b/)?.[1]);
  return Number.isInteger(number) && number >= 1 && number <= 300 ? number : undefined;
}

/**
 * This is deliberately an operator-triggered, source-minimising helper. It
 * reads only schema.org / metadata facts from one public HTTPS page and does
 * not save page HTML, images, editorial copy, cookies, credentials or scripts.
 * The operator still confirms every field before a private candidate is made.
 */
export async function draftProductFromPublicFacts(input: string): Promise<OperatorProductDraft> {
  const url = await validatePublicSourceUrl(input);
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "PerfectPairFactDraft/1.0 (+https://perfectpair-theta.vercel.app)" },
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new ProductDraftError("无法读取该产品页。请确认链接可公开访问，或直接手动填写资料。");
  }
  if (!response.ok) throw new ProductDraftError(`产品页返回 ${response.status}，请检查链接。`);
  const type = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!type.includes("text/html") && !type.includes("application/xhtml+xml")) throw new ProductDraftError("该链接不是可读取的 HTML 产品页。");
  const html = await readLimitedText(response);
  const product = structuredProducts(html)[0];
  const brand = namedValue(product?.brand);
  const name = trimText(product?.name) ?? metaContent(html, "og:title") ?? titleContent(html);
  const material = textList(product?.material ?? additionalValue(product ?? {}, ["material", "fabric", "composition"]));
  const sizeRange = trimText(product?.size, 100) ?? additionalValue(product ?? {}, ["size range", "size", "fit range"]);
  const productIdentifier = trimText(product?.sku ?? product?.gtin13 ?? product?.gtin12 ?? product?.mpn, 100);
  const denierHint = numberHint(additionalValue(product ?? {}, ["denier"]));
  const categoryHint = inferCategory(product?.category, name, metaContent(html, "og:type"));
  const warnings = [
    "仅提取公开结构化事实；未读取或保存图片、商品长描述、评论或原始页面内容。",
    "请在创建候选资料前核对所有字段；未识别的结构与尺码信息不可猜测。",
    ...(!brand ? ["未在结构化资料中找到品牌名称，请手动核对填写。"] : []),
    ...(!product ? ["该页面没有可用的 Product 结构化数据，仅尝试填入页面标题。"] : []),
  ];
  return { sourceUrl: url.toString(), brand, name, material, sizeRange, productIdentifier, categoryHint, denierHint, warnings };
}

export function productDraftErrorMessage(error: unknown) {
  return error instanceof ProductDraftError ? error.message : "无法建立产品资料草稿，请稍后重试。";
}
