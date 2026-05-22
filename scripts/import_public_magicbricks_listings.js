import fs from "node:fs/promises";

const LOCALITIES = [
  { area: "viman_nagar", label: "Viman Nagar", slug: "viman-nagar" },
  { area: "baner", label: "Baner", slug: "baner" },
  { area: "kharadi", label: "Kharadi", slug: "kharadi" },
  { area: "koregaon_park", label: "Koregaon Park", slug: "koregaon-park" },
  { area: "wakad", label: "Wakad", slug: "wakad" },
];

function sourcesFor(locality) {
  return [
    {
      ...locality,
      intent: "rent",
      url: `https://www.magicbricks.com/flats-for-rent-in-${locality.slug}-pune-pppfr`,
    },
    {
      ...locality,
      intent: "buy",
      url: `https://www.magicbricks.com/flats-in-${locality.slug}-pune-for-sale-pppfs`,
    },
  ];
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
  const id = decodeMagicBricksId(url);
  const rawTitle = apartment.name || `${source.label} apartment`;
  const beds = Number(apartment.numberOfRooms) || numberFromText(rawTitle, /(\d+)\s*BHK/i) || 2;
  const sqft = numberFromText(url, /(\d+)-Sq-ft/i) || (beds === 1 ? 650 : beds === 2 ? 1150 : 1650);
  const price = getListingPrice(html, id) || (source.intent === "rent" ? beds * 22000 : beds * 6500000);
  const lat = Number(apartment.geo?.latitude);
  const lng = Number(apartment.geo?.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    id: source.intent === "rent" ? 200000 + index : 300000 + index,
    source: "MagicBricks public listing metadata",
    area: source.area,
    intent: source.intent,
    title: cleanTitle(rawTitle, source.label),
    price,
    beds,
    baths: Math.max(1, Math.min(4, beds)),
    sqft,
    lat,
    lng,
    tag: source.intent === "rent" ? "Public rental metadata" : "Public sale metadata",
    image: apartment.image || "",
  };
}

async function fetchSource(source, offset) {
  const response = await fetch(source.url, {
    headers: {
      "user-agent": "Mozilla/5.0 compatible; local POC data importer",
    },
  });
  if (!response.ok) {
    console.warn(`Skipping ${source.url}: ${response.status}`);
    return [];
  }

  const html = await response.text();
  const apartments = parseJsonLdBlocks(html).filter((item) => item["@type"] === "Apartment");
  return apartments
    .slice(0, 8)
    .map((apartment, index) => listingFromApartment(apartment, offset + index + 1, source, html))
    .filter(Boolean);
}

async function main() {
  const sources = LOCALITIES.flatMap(sourcesFor);
  const allListings = [];

  for (const [sourceIndex, source] of sources.entries()) {
    const listings = await fetchSource(source, sourceIndex * 1000);
    allListings.push(...listings);
    console.log(`${source.label} ${source.intent}: ${listings.length}`);
  }

  const output = `export const PUBLIC_LISTINGS = ${JSON.stringify(allListings, null, 2)};\n`;
  await fs.writeFile(new URL("../src/publicListings.js", import.meta.url), output);
  console.log(`Wrote ${allListings.length} listings to src/publicListings.js`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
