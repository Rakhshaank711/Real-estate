function slugifyLocality(value = "") {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugCandidates(locality) {
  const slug = slugifyLocality(locality);
  const aliases = {
    nibm: ["nibm-road", "nibm-annexe", "mohammed-wadi", "undri", "nibm"],
    "nibm-road": ["nibm-road", "nibm-annexe", "mohammed-wadi", "undri"],
    "nibm-annexe": ["nibm-annexe", "nibm-road", "mohammed-wadi", "undri"],
  };
  return aliases[slug] || [slug];
}

function decodeMagicBricksId(url) {
  const encoded = url.match(/id=([0-9a-fA-F]+)/)?.[1];
  if (!encoded || encoded.length % 2) return null;
  const decoded = encoded.match(/../g).map((part) => String.fromCharCode(parseInt(part, 16))).join("");
  return decoded.replace(/^MB/, "");
}

function parseJsonLdBlocks(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  return blocks.flatMap((match) => {
    try {
      const parsed = JSON.parse(match[1].trim());
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  });
}

function numberFromText(text, pattern) {
  const value = text.match(pattern)?.[1];
  return value ? Number(value.replace(/,/g, "")) : null;
}

function getListingPrice(html, id) {
  if (!id) return null;
  const idIndex = html.indexOf(`"id":"${id}"`);
  if (idIndex === -1) return null;
  const slice = html.slice(Math.max(0, idIndex - 2500), Math.min(html.length, idIndex + 6500));
  const price = numberFromText(slice, /"price":(\d+)/);
  if (price) return price;

  const priceDisplay = slice.match(/"priceD":"([^"]+)"/)?.[1];
  if (!priceDisplay) return null;
  if (priceDisplay.includes("Cr")) return Math.round(Number(priceDisplay.replace(/[^\d.]/g, "")) * 10000000);
  if (priceDisplay.includes("Lac")) return Math.round(Number(priceDisplay.replace(/[^\d.]/g, "")) * 100000);
  return Number(priceDisplay.replace(/[^\d]/g, "")) || null;
}

function cleanTitle(title, localityLabel) {
  return title
    .replace(/\s+/g, " ")
    .replace(/ Flat\s+/i, " ")
    .replace(new RegExp(`${localityLabel}( Central)?, Pune`, "i"), localityLabel)
    .trim();
}

function listingFromApartment(apartment, index, source, html) {
  const url = apartment.url || apartment["@id"] || "";
  const magicBricksId = decodeMagicBricksId(url);
  const rawTitle = apartment.name || `${source.label} apartment`;
  const beds = Number(apartment.numberOfRooms) || numberFromText(rawTitle, /(\d+)\s*BHK/i) || 2;
  const sqft = numberFromText(url, /(\d+)-Sq-ft/i) || (beds === 1 ? 650 : beds === 2 ? 1150 : 1650);
  const price = getListingPrice(html, magicBricksId) || (source.intent === "rent" ? beds * 22000 : beds * 6500000);
  const lat = Number(apartment.geo?.latitude);
  const lng = Number(apartment.geo?.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    id: Number(`${source.intent === "rent" ? 7 : 8}${String(source.slugHash).slice(0, 4)}${String(index + 1).padStart(2, "0")}`),
    magicBricksId,
    source: "MagicBricks live public metadata",
    area: source.area,
    intent: source.intent,
    title: cleanTitle(rawTitle, source.label),
    price,
    beds,
    baths: Math.max(1, Math.min(4, beds)),
    sqft,
    lat,
    lng,
    tag: source.intent === "rent" ? "Live rental metadata" : "Live sale metadata",
    image: apartment.image || "",
    url,
  };
}

function hashSlug(slug) {
  return [...slug].reduce((total, char) => total + char.charCodeAt(0), 0) * 97;
}

async function fetchListingsForSlug({ locality, intent, slug }) {
  const url = intent === "buy"
    ? `https://www.magicbricks.com/flats-in-${slug}-pune-for-sale-pppfs`
    : `https://www.magicbricks.com/flats-for-rent-in-${slug}-pune-pppfr`;

  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 compatible; PuneStay live listing lookup",
    },
  });

  if (!response.ok) {
    return { listings: [], sourceUrl: url, status: response.status };
  }

  const html = await response.text();
  const source = {
    area: slug.replace(/-/g, "_"),
    label: locality,
    slugHash: hashSlug(slug),
    intent,
  };
  const listings = parseJsonLdBlocks(html)
    .filter((item) => item["@type"] === "Apartment")
    .slice(0, 10)
    .map((apartment, index) => listingFromApartment(apartment, index, source, html))
    .filter(Boolean);

  return { listings, sourceUrl: url, status: 200 };
}

async function fetchListings({ locality, intent }) {
  const attempted = [];
  for (const slug of slugCandidates(locality)) {
    const result = await fetchListingsForSlug({ locality, intent, slug });
    attempted.push(result.sourceUrl);
    if (result.listings.length) return { ...result, attempted };
  }
  return { listings: [], sourceUrl: attempted[0], attempted, status: 404 };
}

export default async function handler(request, response) {
  const locality = String(request.query.locality || "").trim();
  const intent = request.query.intent === "buy" ? "buy" : "rent";

  if (!locality || locality.length < 3) {
    response.status(400).json({ listings: [], error: "Missing locality" });
    return;
  }

  try {
    const result = await fetchListings({ locality, intent });
    response.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=86400");
    response.status(200).json(result);
  } catch (error) {
    response.status(500).json({ listings: [], error: error.message });
  }
}
