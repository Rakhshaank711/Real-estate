import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles.css";
import { PUBLIC_LISTINGS } from "./publicListings";

const PUNE_MAP_CENTER = [18.548, 73.8567];

const AREA_CENTERS = {
  koregaon_park: [18.5362, 73.8958],
  baner: [18.559, 73.7868],
  kharadi: [18.5515, 73.9348],
  viman_nagar: [18.5679, 73.9143],
  wakad: [18.5977, 73.7649],
  nibm_road: [18.4773, 73.8996],
};

const AREA_OPTIONS = [
  ["koregaon_park", "Koregaon Park"],
  ["baner", "Baner"],
  ["kharadi", "Kharadi"],
  ["viman_nagar", "Viman Nagar"],
  ["wakad", "Wakad"],
  ["nibm_road", "NIBM Road"],
];

const TOP_LOCALITY_AREAS = ["koregaon_park", "baner", "kharadi", "viman_nagar", "wakad"];

const LIVE_LOCALITY_CANDIDATES = [
  ["viman_nagar", "Viman Nagar", [18.5679, 73.9143]],
  ["kharadi", "Kharadi", [18.5515, 73.9348]],
  ["koregaon_park", "Koregaon Park", [18.5362, 73.8958]],
  ["baner", "Baner", [18.559, 73.7868]],
  ["wakad", "Wakad", [18.5977, 73.7649]],
  ["nibm_road", "NIBM Road", [18.4773, 73.8996]],
  ["nibm_annexe", "NIBM Annexe", [18.4658, 73.9024]],
  ["mohammed_wadi", "Mohammed Wadi", [18.4788, 73.9157]],
  ["undri", "Undri", [18.4575, 73.9179]],
  ["hadapsar", "Hadapsar", [18.5089, 73.9259]],
  ["magarpatta_city", "Magarpatta City", [18.5163, 73.9327]],
  ["mundhwa", "Mundhwa", [18.5337, 73.9316]],
  ["kalyani_nagar", "Kalyani Nagar", [18.5463, 73.9033]],
  ["balewadi", "Balewadi", [18.576, 73.7798]],
  ["aundh", "Aundh", [18.5602, 73.8077]],
  ["pashan", "Pashan", [18.5386, 73.7953]],
  ["kothrud", "Kothrud", [18.5074, 73.8077]],
  ["hinjewadi", "Hinjewadi", [18.5913, 73.7389]],
];

const LOCATION_SUGGESTIONS = [
  { id: "koregaon_park", label: "Koregaon Park", detail: "Cafes, premium rentals, central Pune" },
  { id: "baner", label: "Baner", detail: "Balewadi High Street, family societies" },
  { id: "kharadi", label: "Kharadi", detail: "EON IT Park, WTC, airport side" },
  { id: "wakad", label: "Wakad", detail: "Hinjewadi commute, newer projects" },
  { id: "viman_nagar", label: "Viman Nagar", detail: "Airport side, Phoenix Marketcity, rentals" },
  { id: "nibm_road", label: "NIBM", detail: "NIBM Road, NIBM Annexe, Mohammed Wadi side" },
  { id: "nibm_road", label: "NIBM Road", detail: "South Pune rentals and gated societies" },
  { id: "nibm_road", label: "NIBM Annexe", detail: "Near Undri and Mohammed Wadi" },
  { id: "nibm_road", label: "Mohammed Wadi", detail: "Near NIBM Road and Undri" },
  { id: "nibm_road", label: "Undri", detail: "South Pune, near NIBM Annexe" },
  { id: "kharadi", label: "Kalyani Nagar", detail: "Premium river-side apartments" },
  { id: "koregaon_park", label: "Koregaon Park Annexe", detail: "Near Mundhwa and Kalyani Nagar" },
  { id: "koregaon_park", label: "Mundhwa", detail: "Near KP, Magarpatta, Kharadi commute" },
  { id: "kharadi", label: "Magarpatta City", detail: "Township living near Hadapsar" },
  { id: "kharadi", label: "Hadapsar", detail: "Magarpatta, Amanora, IT commute" },
  { id: "baner", label: "Aundh", detail: "Established west Pune neighborhood" },
  { id: "baner", label: "Pashan", detail: "Quiet residential pockets near Baner" },
  { id: "baner", label: "Balewadi", detail: "Sports complex, high street, new societies" },
  { id: "wakad", label: "Pimple Saudagar", detail: "Family societies near Wakad" },
  { id: "wakad", label: "Ravet", detail: "Affordable projects, PCMC side" },
  { id: "wakad", label: "Tathawade", detail: "Newer projects near Wakad" },
  { id: "koregaon_park", label: "Shivaji Nagar", detail: "Central Pune, offices, older apartments" },
  { id: "koregaon_park", label: "Deccan Gymkhana", detail: "Central Pune, colleges, cafes" },
  { id: "koregaon_park", label: "Kothrud", detail: "Established residential west Pune" },
  { id: "koregaon_park", label: "Karve Nagar", detail: "Residential, central-west Pune" },
  { id: "baner", label: "Balewadi High Street", detail: "Restaurants, offices, gated apartments" },
  { id: "wakad", label: "Hinjewadi Phase 1", detail: "Tech park commute, leasing demand" },
  { id: "wakad", label: "Hinjewadi Phase 2", detail: "IT park side, rental demand" },
  { id: "wakad", label: "Hinjewadi Phase 3", detail: "Campus-side projects and rentals" },
  { id: "kharadi", label: "World Trade Center Pune", detail: "Office hub near Kharadi" },
  { id: "kharadi", label: "EON IT Park", detail: "Kharadi office hub" },
  { id: "viman_nagar", label: "Phoenix Marketcity Pune", detail: "Viman Nagar landmark" },
  { id: "viman_nagar", label: "Pune Airport", detail: "Viman Nagar and Lohegaon side" },
  { id: "koregaon_park", label: "North Main Road", detail: "Koregaon Park lifestyle corridor" },
];

const PUNE_BBOX = "73.65,18.4,74.05,18.75";

const LISTINGS = PUBLIC_LISTINGS;

function formatIndianNumber(value) {
  return value.toLocaleString("en-IN");
}

function formatPrice(listing) {
  if (listing.intent === "rent") return `Rs ${formatIndianNumber(listing.price)}/mo`;
  if (listing.price >= 10000000) return `Rs ${(listing.price / 10000000).toFixed(2)} Cr`;
  return `Rs ${(listing.price / 100000).toFixed(1)} L`;
}

function markerLabel(listing) {
  if (listing.intent === "rent") return `Rs ${Math.round(listing.price / 1000)}k`;
  if (listing.price >= 10000000) return `Rs ${(listing.price / 10000000).toFixed(1)}Cr`;
  return `Rs ${Math.round(listing.price / 100000)}L`;
}

function areaLabel(area) {
  return AREA_OPTIONS.find(([value]) => value === area)?.[1] ?? "Pune";
}

function listingToHomeCard(listing, index) {
  const priceContext = listing.intent === "rent" ? "per month" : "asking";
  return {
    id: listing.id,
    title: listing.title,
    meta: `${formatPrice(listing)} ${priceContext} - ${areaLabel(listing.area)}`,
    image: listing.image,
  };
}

function getHomeCards({ area, intent, excludeArea = false, limit = 7 }) {
  return LISTINGS
    .filter((listing) => listing.intent === intent && (excludeArea ? listing.area !== area : listing.area === area))
    .slice(0, limit)
    .map(listingToHomeCard);
}

function getListingImages(listing) {
  if (!listing) return [];
  const relatedImages = LISTINGS
    .filter((item) => item.id !== listing.id && item.area === listing.area && item.intent === listing.intent)
    .map((item) => item.image);
  const fallbackImages = LISTINGS
    .filter((item) => item.id !== listing.id && item.intent === listing.intent)
    .map((item) => item.image);
  return [listing.image, ...relatedImages, ...fallbackImages].filter(Boolean).slice(0, 5);
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function getLocalityStats(area) {
  const rentListings = LISTINGS.filter((listing) => listing.area === area && listing.intent === "rent");
  const buyListings = LISTINGS.filter((listing) => listing.area === area && listing.intent === "buy");
  return {
    area,
    label: areaLabel(area),
    rentCount: rentListings.length,
    buyCount: buyListings.length,
    medianRent: median(rentListings.map((listing) => listing.price)),
    medianBuy: median(buyListings.map((listing) => listing.price)),
    image: (rentListings[0] ?? buyListings[0])?.image,
  };
}

function mergeListings(baseListings, liveListings) {
  const seen = new Set();
  return [...liveListings, ...baseListings].filter((listing) => {
    const key = listing.magicBricksId || `${listing.intent}-${listing.lat}-${listing.lng}-${listing.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getMatches(search, listingPool = LISTINGS) {
  const matches = listingPool.filter((listing) => {
    return listing.intent === search.intent && listing.price <= search.budget && listing.beds >= search.beds;
  });

  if (matches.length) return matches;
  return listingPool.filter((listing) => listing.intent === search.intent).slice(0, 6);
}

function nearestAreaFromCoords(coords) {
  if (!coords) return "koregaon_park";
  const [lon, lat] = coords;
  let nearest = "koregaon_park";
  let nearestDistance = Number.MAX_SAFE_INTEGER;

  Object.entries(AREA_CENTERS).forEach(([area, [areaLat, areaLon]]) => {
    const distance = Math.hypot(lat - areaLat, lon - areaLon);
    if (distance < nearestDistance) {
      nearest = area;
      nearestDistance = distance;
    }
  });

  return nearest;
}

function nearestAreaFromLatLng(lat, lng) {
  let nearest = "koregaon_park";
  let nearestDistance = Number.MAX_SAFE_INTEGER;

  Object.entries(AREA_CENTERS).forEach(([area, [areaLat, areaLng]]) => {
    const distance = Math.hypot(lat - areaLat, lng - areaLng);
    if (distance < nearestDistance) {
      nearest = area;
      nearestDistance = distance;
    }
  });

  return nearest;
}

function getLiveLookupLocalitiesForBounds(bounds, inFrameListings) {
  const center = bounds.getCenter();
  const labels = new Set(inFrameListings.map((listing) => areaLabel(listing.area)).filter((label) => label && label !== "Pune"));

  const rankedCandidates = LIVE_LOCALITY_CANDIDATES
    .map(([area, label, [lat, lng]]) => ({
      area,
      label,
      inBounds: bounds.contains([lat, lng]),
      distance: Math.hypot(center.lat - lat, center.lng - lng),
    }))
    .sort((a, b) => Number(b.inBounds) - Number(a.inBounds) || a.distance - b.distance);

  rankedCandidates.forEach((candidate) => {
    if (candidate.inBounds || labels.size < 8) labels.add(candidate.label);
  });

  if (!labels.size) labels.add(areaLabel(nearestAreaFromLatLng(center.lat, center.lng)));
  return [...labels].slice(0, 8);
}

function HeaderActions({ menuId }) {
  return (
    <div className="host-actions">
      <button type="button">Saved homes</button>
      <button className="round-button" id={menuId} type="button" aria-label="Menu">
        <span aria-hidden="true" />
      </button>
    </div>
  );
}

function Brand({ asButton = false, onClick }) {
  const Tag = asButton ? "button" : "a";
  return (
    <Tag className="brand map-brand" href={asButton ? undefined : "#"} onClick={onClick} aria-label="PuneStay home" type={asButton ? "button" : undefined}>
      <span className="brand-mark">A</span>
      <span>PuneStay</span>
    </Tag>
  );
}

function HomeCard({ card, onOpen }) {
  return (
    <button className="home-card" type="button" onClick={() => onOpen(card.id)}>
      <img src={card.image} alt="" />
      <span className="heart" aria-hidden="true" />
      <h3>{card.title}</h3>
      <p>{card.meta}</p>
    </button>
  );
}

function HomeRow({ title, cards, onOpen }) {
  return (
    <section className="property-row" aria-labelledby={`${title.replaceAll(" ", "-")}-title`}>
      <div className="row-heading">
        <h2 id={`${title.replaceAll(" ", "-")}-title`}>{title}</h2>
        <button className="arrow-chip" type="button" aria-label="Open row">
          <span aria-hidden="true" />
        </button>
        <div className="row-controls">
          <button type="button" disabled>
            &lt;
          </button>
          <button type="button">&gt;</button>
        </div>
      </div>
      <div className="card-track">
        {cards.map((card) => (
          <HomeCard key={card.id} card={card} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

function LocationSearchSegment({ search, setSearch, compact = false }) {
  const selectedAreaLabel = areaLabel(search.area);
  const [locationQuery, setLocationQuery] = useState(selectedAreaLabel);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [externalSuggestions, setExternalSuggestions] = useState([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);

  useEffect(() => {
    const query = locationQuery.trim();
    if (query.length < 3) {
      setExternalSuggestions([]);
      setIsSearchingPlaces(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsSearchingPlaces(true);
      try {
        const params = new URLSearchParams({
          q: query,
          limit: "6",
          lang: "en",
          countrycode: "IN",
          bbox: PUNE_BBOX,
          lat: String(PUNE_MAP_CENTER[0]),
          lon: String(PUNE_MAP_CENTER[1]),
        });
        const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Place search failed");
        const data = await response.json();
        const suggestions = (data.features ?? []).map((feature) => {
          const props = feature.properties ?? {};
          const label = props.name || props.street || props.city || "Pune location";
          const detailParts = [props.district, props.city, props.state, props.country].filter(Boolean);
          return {
            id: nearestAreaFromCoords(feature.geometry?.coordinates),
            label,
            detail: detailParts.join(", ") || "External map result",
            coords: feature.geometry?.coordinates,
            source: "Photon",
          };
        });
        setExternalSuggestions(suggestions);
      } catch (error) {
        if (error.name !== "AbortError") setExternalSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setIsSearchingPlaces(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [locationQuery]);

  const filteredSuggestions = useMemo(() => {
    const query = locationQuery.trim().toLowerCase();
    if (!query) return LOCATION_SUGGESTIONS.slice(0, 5);
    const queryTokens = query.split(/\s+/).filter(Boolean);
    const localSuggestions = LOCATION_SUGGESTIONS.filter((item) => {
      const haystack = `${item.label} ${item.detail}`.toLowerCase();
      return queryTokens.every((token) => haystack.includes(token));
    });

    const seen = new Set(localSuggestions.map((item) => `${item.label}-${item.detail}`.toLowerCase()));
    const remoteSuggestions = externalSuggestions.filter((item) => {
      const key = `${item.label}-${item.detail}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return [...localSuggestions, ...remoteSuggestions].slice(0, 7);
  }, [externalSuggestions, locationQuery]);

  function chooseLocation(suggestion) {
    const center = suggestion.coords ? [suggestion.coords[1], suggestion.coords[0]] : AREA_CENTERS[suggestion.id];
    setSearch((current) => ({ ...current, area: suggestion.id, center, locality: suggestion.label }));
    setLocationQuery(suggestion.label);
    setShowSuggestions(false);
    setActiveSuggestion(0);
  }

  function handleLocationKeyDown(event) {
    if (!showSuggestions && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setShowSuggestions(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((current) => Math.min(current + 1, filteredSuggestions.length - 1));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((current) => Math.max(current - 1, 0));
    }

    if (event.key === "Enter" && showSuggestions && filteredSuggestions[activeSuggestion]) {
      event.preventDefault();
      chooseLocation(filteredSuggestions[activeSuggestion]);
    }

    if (event.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <label className={`search-segment location-segment${compact ? " compact" : ""}`}>
      <span>Where</span>
      <input
        type="text"
        value={locationQuery}
        placeholder="Search Pune areas"
        autoComplete="off"
        onFocus={() => setShowSuggestions(true)}
        onChange={(event) => {
          const value = event.target.value;
          const exactSuggestion = LOCATION_SUGGESTIONS.find((item) => item.label.toLowerCase() === value.trim().toLowerCase());
          setLocationQuery(value);
          setSearch((current) => ({
            ...current,
            locality: value,
            ...(exactSuggestion ? { area: exactSuggestion.id, center: AREA_CENTERS[exactSuggestion.id] } : {}),
          }));
          setShowSuggestions(true);
          setActiveSuggestion(0);
        }}
        onKeyDown={handleLocationKeyDown}
      />
      {showSuggestions && (
        <div className="location-suggestions" role="listbox">
          {filteredSuggestions.length ? (
            filteredSuggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.label}-${suggestion.id}`}
                className={index === activeSuggestion ? "active" : ""}
                type="button"
                role="option"
                aria-selected={index === activeSuggestion}
                onMouseDown={(event) => {
                  event.preventDefault();
                  chooseLocation(suggestion);
                }}
              >
                <strong>{suggestion.label}</strong>
                <small>{suggestion.detail}{suggestion.source ? ` - ${suggestion.source}` : ""}</small>
              </button>
            ))
          ) : isSearchingPlaces ? (
            <div className="suggestion-empty">Searching map places...</div>
          ) : (
            <div className="suggestion-empty">No matching Pune area</div>
          )}
        </div>
      )}
    </label>
  );
}

function IntentSegment({ search, setSearch, compact = false }) {
  return (
    <div className={`search-segment intent-segment${compact ? " compact" : ""}`}>
      <div className="inline-segmented" role="radiogroup" aria-label="Property intent">
        <button className={search.intent === "rent" ? "active" : ""} type="button" onClick={() => updateSearchIntent(setSearch, "rent")}>Lease</button>
        <button className={search.intent === "buy" ? "active" : ""} type="button" onClick={() => updateSearchIntent(setSearch, "buy")}>Buy</button>
      </div>
    </div>
  );
}

function BudgetSegment({ search, setSearch, compact = false }) {
  const [open, setOpen] = useState(false);
  const step = search.intent === "buy" ? 500000 : 5000;
  const min = search.intent === "buy" ? 5000000 : 10000;
  const max = search.intent === "buy" ? 50000000 : 150000;
  const presets = search.intent === "buy" ? [7500000, 10000000, 15000000, 20000000, 30000000] : [25000, 50000, 75000, 100000, 150000];
  const displayValue = search.intent === "buy" ? formatPrice({ intent: "buy", price: search.budget }) : `Rs ${formatIndianNumber(search.budget)}/mo`;
  const updateBudget = (value) => setSearch((current) => ({ ...current, budget: Math.min(max, Math.max(min, value)) }));

  return (
    <div className={`search-segment budget-segment${compact ? " compact" : ""}`}>
      <span>Budget</span>
      <div
        className="budget-control"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
        }}
      >
        <button type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
          {displayValue}
        </button>
        {open && (
          <div className="budget-popover">
            <div className="budget-stepper">
              <button type="button" onClick={() => updateBudget(search.budget - step)}>-</button>
              <strong>{displayValue}</strong>
              <button type="button" onClick={() => updateBudget(search.budget + step)}>+</button>
            </div>
            <input
              type="range"
              aria-label="Budget"
              value={search.budget}
              min={min}
              max={max}
              step={step}
              onChange={(event) => updateBudget(Number(event.target.value))}
            />
            <div className="budget-presets">
              {presets.map((preset) => (
                <button key={preset} type="button" onClick={() => updateBudget(preset)}>
                  {search.intent === "buy" ? formatPrice({ intent: "buy", price: preset }) : `Rs ${formatIndianNumber(preset / 1000)}k`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function updateSearchIntent(setSearch, intent) {
  setSearch((current) => ({
    ...current,
    intent,
    budget: intent === "buy" ? 20000000 : 65000,
  }));
}

function HomeScreen({ search, setSearch, onSearch, onOpenListing }) {
  const primaryCards = useMemo(() => getHomeCards({ area: search.area, intent: search.intent }), [search.area, search.intent]);
  const secondaryCards = useMemo(() => getHomeCards({ area: search.area, intent: search.intent, excludeArea: true }), [search.area, search.intent]);
  const localityStats = useMemo(() => TOP_LOCALITY_AREAS.map((area) => getLocalityStats(area)), []);
  const selectedAreaLabel = areaLabel(search.area);
  const budgetShortcuts = [
    { label: "Under Rs 25k rent", detail: "Budget rentals", intent: "rent", budget: 25000, beds: 1, area: search.area },
    { label: "Rs 25k-50k rent", detail: "Most searched", intent: "rent", budget: 50000, beds: 1, area: search.area },
    { label: "2 BHK rentals", detail: "Family ready", intent: "rent", budget: 65000, beds: 2, area: search.area },
    { label: "Under Rs 1 Cr buy", detail: "Entry purchase", intent: "buy", budget: 10000000, beds: 1, area: search.area },
    { label: "Near airport", detail: "Viman Nagar", intent: "rent", budget: 65000, beds: 1, area: "viman_nagar" },
    { label: "IT corridor", detail: "Kharadi", intent: "rent", budget: 65000, beds: 1, area: "kharadi" },
  ];

  function updateIntent(intent) {
    updateSearchIntent(setSearch, intent);
  }

  function openShortcut(shortcut) {
    onSearch({
      ...search,
      area: shortcut.area,
      intent: shortcut.intent,
      budget: shortcut.budget,
      beds: shortcut.beds,
      center: AREA_CENTERS[shortcut.area] ?? search.center,
    });
  }

  function openLocality(area, intent = search.intent) {
    onSearch({
      ...search,
      area,
      intent,
      budget: intent === "buy" ? 20000000 : 65000,
      beds: 1,
      center: AREA_CENTERS[area] ?? search.center,
    });
  }

  return (
    <section className="home-screen" aria-label="Pune property homepage">
      <header className="site-header">
        <Brand />
        <nav className="home-nav" aria-label="Property sections">
          <button className={search.intent === "rent" ? "active" : ""} type="button" onClick={() => updateIntent("rent")}>Lease</button>
          <button className={search.intent === "buy" ? "active" : ""} type="button" onClick={() => updateIntent("buy")}>Buy</button>
          <button type="button" onClick={onSearch}>Map search</button>
        </nav>
        <HeaderActions />
      </header>

      <section className="home-hero">
        <div className="hero-panel">
          <div className="search-wrap">
            <form className="air-search" onSubmit={onSearch}>
              <LocationSearchSegment search={search} setSearch={setSearch} />
              <IntentSegment search={search} setSearch={setSearch} />
              <BudgetSegment search={search} setSearch={setSearch} />
              <button className="search-button" type="submit" aria-label="Search" />
            </form>
          </div>

        </div>
      </section>

      <section className="home-discovery" aria-label="Search shortcuts">
        <div className="shortcut-row">
          {budgetShortcuts.map((shortcut) => (
            <button key={`${shortcut.label}-${shortcut.area}`} type="button" onClick={() => openShortcut(shortcut)}>
              <strong>{shortcut.label}</strong>
              <span>{shortcut.detail}</span>
            </button>
          ))}
        </div>

        <section className="locality-section" aria-labelledby="top-localities-title">
          <div className="row-heading">
            <h2 id="top-localities-title">Top localities</h2>
          </div>
          <div className="locality-grid">
            {localityStats.map((stat) => (
              <article key={stat.area} className="locality-card">
                <img src={stat.image} alt="" />
                <div>
                  <h3>{stat.label}</h3>
                  <p>{stat.rentCount} rentals - {stat.buyCount} homes to buy</p>
                  <p>Median rent {stat.medianRent ? `Rs ${formatIndianNumber(stat.medianRent)}` : "N/A"} - Buy {stat.medianBuy ? formatPrice({ intent: "buy", price: stat.medianBuy }) : "N/A"}</p>
                </div>
                <div className="locality-actions">
                  <button type="button" onClick={() => openLocality(stat.area, "rent")}>Lease</button>
                  <button type="button" onClick={() => openLocality(stat.area, "buy")}>Buy</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="home-content">
        <HomeRow title={search.intent === "rent" ? `Leasing picks in ${selectedAreaLabel}` : `Homes to buy in ${selectedAreaLabel}`} cards={primaryCards} onOpen={onOpenListing} />
        <HomeRow title="Similar places nearby" cards={secondaryCards} onOpen={onOpenListing} />
      </section>
    </section>
  );
}

function MapFallback() {
  return (
    <div className="map-fallback" aria-hidden="true">
      <span className="river river-one" />
      <span className="river river-two" />
      <span className="park park-one" />
      <span className="park park-two" />
      <span className="park park-three" />
      <span className="park park-four" />
      <span className="road highway road-one" />
      <span className="road highway road-two" />
      <span className="road arterial road-three" />
      <span className="road arterial road-four" />
      <span className="road arterial road-five" />
      <span className="road small-road road-six" />
      <span className="road small-road road-seven" />
      <span className="road small-road road-eight" />
      <span className="map-label pune">Pune</span>
      <span className="map-label airport">Pune Airport</span>
      <span className="map-label kharadi">Kharadi</span>
      <span className="map-label baner">Baner</span>
      <span className="map-label wakad">Wakad</span>
      <span className="map-label koregaon">Koregaon Park</span>
      <span className="map-label kothrud">Kothrud</span>
      <span className="map-label hadapsar">Hadapsar</span>
      <span className="road-tag tag-one">NH 48</span>
      <span className="road-tag tag-two">NH 60</span>
      <span className="poi poi-one" />
      <span className="poi poi-two" />
      <span className="poi poi-three" />
      <span className="poi poi-four" />
      <span className="map-chip chip-one">Rs 58k</span>
      <span className="map-chip chip-two">Rs 42k</span>
      <span className="map-chip chip-three">Rs 47k</span>
      <span className="map-chip chip-four">Rs 35k</span>
      <span className="map-chip chip-five">Rs 52k</span>
    </div>
  );
}

const MapPreviewCard = React.forwardRef(function MapPreviewCard({ listing, position, onClose, onOpenListing }, ref) {
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [listing?.id]);

  if (!listing) return null;

  const images = getListingImages(listing);

  return (
    <aside ref={ref} className="map-preview-card" style={position ? { left: position.x, top: position.y } : undefined} aria-live="polite">
      <div className="preview-media">
        <img src={images[imageIndex]} alt="" />
        <button className="preview-close" type="button" aria-label="Close" onClick={onClose}>
          <span aria-hidden="true" />
        </button>
        <button className="preview-prev" type="button" aria-label="Previous photo" onClick={() => setImageIndex((current) => (current - 1 + images.length) % images.length)}>
          <span aria-hidden="true" />
        </button>
        <button className="preview-next" type="button" aria-label="Next photo" onClick={() => setImageIndex((current) => (current + 1) % images.length)}>
          <span aria-hidden="true" />
        </button>
        <div className="preview-dots" aria-hidden="true">
          {images.map((image, index) => (
            <span key={image} className={index === imageIndex ? "active" : ""} />
          ))}
        </div>
      </div>
      <div className="preview-body">
        <div className="preview-copy">
          <h2>{listing.title}</h2>
          <p>
            {listing.tag} · {listing.beds} bed · {listing.baths} bath · {listing.sqft.toLocaleString("en-IN")} sqft
          </p>
          <strong>{formatPrice(listing)} {listing.intent === "rent" ? "lease" : "asking"}</strong>
          <button className="preview-details" type="button" onClick={() => onOpenListing(listing.id)}>View listing</button>
        </div>
      </div>
    </aside>
  );
});

function LeafletMap({ listings, selectedId, onSelect, onOpenListing, onSearchArea, searchCenter, onVisibleCountChange }) {
  const mapRef = useRef(null);
  const mapNodeRef = useRef(null);
  const previewCardRef = useRef(null);
  const markersRef = useRef(new Map());
  const listingsRef = useRef(listings);
  const onVisibleCountChangeRef = useRef(onVisibleCountChange);
  const [status, setStatus] = useState("Loading real map...");
  const [loaded, setLoaded] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);
  const [areaDirty, setAreaDirty] = useState(false);

  useEffect(() => {
    listingsRef.current = listings;
    onVisibleCountChangeRef.current = onVisibleCountChange;
  }, [listings, onVisibleCountChange]);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return;

    const map = L.map(mapNodeRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(searchCenter ?? PUNE_MAP_CENTER, searchCenter ? 14 : 12);

    const tiles = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
      detectRetina: true,
      crossOrigin: true,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    });

    tiles.on("load", () => {
      setLoaded(true);
      setStatus("OpenStreetMap / CARTO");
    });
    tiles.on("tileerror", () => setStatus("Map tiles unavailable"));
    tiles.addTo(map);
    function closePreview() {
      onSelect(null);
    }

    map.on("click", closePreview);

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 50);

    function markAreaDirty() {
      setAreaDirty(true);
      onVisibleCountChangeRef.current?.(listingsRef.current.filter((listing) => map.getBounds().contains([listing.lat, listing.lng])).length);
    }

    map.on("dragend zoomend", markAreaDirty);

    return () => {
      map.off("click", closePreview);
      map.off("dragend zoomend", markAreaDirty);
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, [onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    onVisibleCountChange?.(listings.filter((listing) => map.getBounds().contains([listing.lat, listing.lng])).length);
  }, [listings, onVisibleCountChange, searchCenter]);

  useEffect(() => {
    if (!mapRef.current || !searchCenter) return;
    mapRef.current.setView(searchCenter, 14, { animate: true });
  }, [searchCenter]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    listings.forEach((listing) => {
      const active = listing.id === selectedId ? " active" : "";
      const icon = L.divIcon({
        className: "",
        html: `<div class="price-marker${active}">${markerLabel(listing)}</div>`,
        iconSize: [82, 34],
        iconAnchor: [41, 17],
      });
      const marker = L.marker([listing.lat, listing.lng], { icon }).addTo(map);
      marker.on("click", (event) => {
        L.DomEvent.stopPropagation(event);
        onSelect(listing.id);
      });
      marker.setZIndexOffset(listing.id === selectedId ? 1000 : 0);
      markersRef.current.set(listing.id, marker);
    });
  }, [listings, selectedId, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    const selected = listings.find((listing) => listing.id === selectedId);
    if (map && selected) {
      const size = map.getSize();
      const cardHeight = previewCardRef.current?.offsetHeight ?? 365;
      const desired = L.point(size.x / 2, Math.max(84, (size.y - cardHeight - 74) / 2));
      const current = map.latLngToContainerPoint([selected.lat, selected.lng]);
      const offset = current.subtract(desired);
      map.panBy(offset, {
        animate: true,
        duration: 0.35,
        easeLinearity: 0.3,
      });
    }
  }, [listings, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    function updatePreviewPosition() {
      const selected = listings.find((listing) => listing.id === selectedId);
      if (!selected) {
        setPreviewPosition(null);
        return;
      }

      const point = map.latLngToContainerPoint([selected.lat, selected.lng]);
      const size = map.getSize();
      const cardWidth = Math.min(330, Math.max(0, size.x - 48));
      const cardHeight = previewCardRef.current?.offsetHeight ?? 365;
      const x = Math.min(Math.max(point.x, cardWidth / 2 + 14), size.x - cardWidth / 2 - 14);
      const preferredY = point.y + 58;
      const minY = point.y + 46;
      const maxY = size.y - cardHeight - 14;
      const y = Math.min(Math.max(preferredY, minY), Math.max(minY, maxY));
      setPreviewPosition({ x, y });
    }

    updatePreviewPosition();
    map.on("move zoom", updatePreviewPosition);
    map.on("moveend zoomend", updatePreviewPosition);

    return () => {
      map.off("move zoom", updatePreviewPosition);
      map.off("moveend zoomend", updatePreviewPosition);
    };
  }, [listings, selectedId]);

  return (
    <section className={`map-pane${loaded ? " real-map-loaded" : ""}`} aria-label="Pune map">
      <MapFallback />
      <div ref={mapNodeRef} className="map-canvas" />
      <MapPreviewCard
        ref={previewCardRef}
        listing={listings.find((listing) => listing.id === selectedId)}
        position={previewPosition}
        onClose={() => onSelect(null)}
        onOpenListing={onOpenListing}
      />
      <div className="map-status">{status}</div>
      <button className="expand-map" type="button" aria-label="Expand map">
        NE
      </button>
      <div className="map-zoom" aria-label="Map controls">
        <button type="button" onClick={() => mapRef.current?.zoomIn()}>
          +
        </button>
        <button type="button" onClick={() => mapRef.current?.zoomOut()}>
          -
        </button>
      </div>
      <button
        className={`area-action${areaDirty ? " visible" : ""}`}
        type="button"
        onClick={() => {
          const bounds = mapRef.current?.getBounds();
          if (bounds) onSearchArea(bounds);
          setAreaDirty(false);
        }}
      >
        Search this area
      </button>
    </section>
  );
}

function MapResultCard({ listing, index, selected, onSelect, onOpenListing, resultRef }) {
  const oldPrice = listing.intent === "rent" ? `Rs ${formatIndianNumber(Math.round(listing.price * 1.12))}` : "";

  return (
    <article ref={resultRef} className={`map-property-card${selected ? " selected" : ""}`}>
      <button className="map-card-select" type="button" onClick={() => onSelect(listing.id)} aria-label={`Select ${listing.title}`}>
        <img src={listing.image} alt="" />
      </button>
      <span className="heart" aria-hidden="true">
        heart
      </span>
      <div className="map-card-heading">
        <h2>{listing.title}</h2>
      </div>
      <p>{listing.tag}</p>
      <p>
        {listing.beds} bedroom - {listing.baths} bathroom
      </p>
      <p>
        {oldPrice && <s>{oldPrice} </s>}
        <strong>{formatPrice(listing).replace("/mo", "")}</strong> {listing.intent === "rent" ? "for 1 month" : "asking"}
      </p>
      <div className="map-card-actions">
        <button type="button" onClick={() => onSelect(listing.id)}>Show on map</button>
        <button type="button" onClick={() => onOpenListing(listing.id)}>Open listing</button>
      </div>
    </article>
  );
}

function PropertySheet({ listing, onOpenListing }) {
  if (!listing) {
    return (
      <aside className="property-sheet" aria-live="polite">
        <div className="sheet-grip" />
        <div className="property-media" />
        <div className="property-info">
          <div>
            <p className="property-price">No exact matches</p>
            <h2>Try a wider budget</h2>
            <p className="property-meta">The POC filters by Pune area, intent, budget, and bedroom count.</p>
          </div>
          <button className="secondary-action" type="button">Edit search</button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="property-sheet" aria-live="polite">
      <div className="sheet-grip" />
      <div className="property-media" style={{ backgroundImage: `url("${listing.image}")` }} />
      <div className="property-info">
        <div>
          <p className="property-price">{formatPrice(listing)}</p>
          <h2>{listing.title}</h2>
          <p className="property-meta">
            {listing.beds} bed - {listing.baths} bath - {listing.sqft.toLocaleString("en-IN")} sqft - {listing.tag}
          </p>
        </div>
        <button className="secondary-action" type="button" onClick={() => onOpenListing(listing.id)}>View full listing</button>
      </div>
    </aside>
  );
}

function PropertyDetailPage({ listing, onBack, onMap }) {
  if (!listing) {
    return (
      <section className="property-page">
        <header className="property-page-header">
          <Brand asButton onClick={onBack} />
          <button className="detail-back" type="button" onClick={onBack}>Back</button>
        </header>
        <div className="property-page-empty">
          <h1>Listing not found</h1>
          <p>This listing is not available in the current dataset.</p>
          <button className="primary-detail-action" type="button" onClick={onBack}>Return to search</button>
        </div>
      </section>
    );
  }

  const images = getListingImages(listing);
  const locality = areaLabel(listing.area);
  const monthlyOrAsking = listing.intent === "rent" ? "Monthly lease" : "Asking price";
  const facts = [
    [`${listing.beds} bedroom${listing.beds > 1 ? "s" : ""}`, "Private home configuration"],
    [`${listing.baths} bathroom${listing.baths > 1 ? "s" : ""}`, "Listing metadata"],
    [`${formatIndianNumber(listing.sqft)} sqft`, "Approximate carpet/saleable area"],
    [locality, "Pune locality"],
  ];

  return (
    <section className="property-page">
      <header className="property-page-header">
        <Brand asButton onClick={onBack} />
        <div className="property-page-actions">
          <button type="button" onClick={onMap}>View on map</button>
          <button className="detail-back" type="button" onClick={onBack}>Back</button>
        </div>
      </header>

      <main className="property-detail">
        <div className="detail-title-row">
          <div>
            <p>{locality}, Pune</p>
            <h1>{listing.title}</h1>
          </div>
        </div>

        <section className="detail-gallery" aria-label="Property photos">
          {images.map((image, index) => (
            <img key={`${listing.id}-${image}`} className={index === 0 ? "featured" : ""} src={image} alt="" />
          ))}
        </section>

        <section className="detail-layout">
          <div className="detail-main">
            <section className="detail-section host-summary">
              <div>
                <h2>{listing.intent === "rent" ? "Entire home for lease" : "Home available to buy"}</h2>
                <p>{listing.beds} bed - {listing.baths} bath - {formatIndianNumber(listing.sqft)} sqft - {listing.tag}</p>
              </div>
              <span>{listing.source ? "Public listing" : "Verified"}</span>
            </section>

            <section className="detail-section fact-grid">
              {facts.map(([title, copy]) => (
                <div key={title}>
                  <strong>{title}</strong>
                  <p>{copy}</p>
                </div>
              ))}
            </section>

            <section className="detail-section">
              <h2>About this place</h2>
              <p>
                A {listing.beds} BHK property in {locality}, listed for {listing.intent === "rent" ? "leasing" : "purchase"} with a practical layout and map-ready location data. Use the map view to compare nearby options and shortlist based on commute, budget and neighborhood fit.
              </p>
            </section>

            <section className="detail-section amenities">
              <h2>What this place offers</h2>
              <div>
                <span>Mapped locality</span>
                <span>Price benchmark</span>
                <span>Bedroom filter</span>
                <span>Area comparison</span>
                <span>Photo preview</span>
                <span>Shortlist ready</span>
              </div>
            </section>

            <section className="detail-section detail-map-card">
              <div>
                <h2>Where you will be</h2>
                <p>{locality}, Pune</p>
              </div>
              <button type="button" onClick={onMap}>Open map</button>
            </section>
          </div>

          <aside className="booking-card">
            <p>{monthlyOrAsking}</p>
            <strong>{formatPrice(listing)}</strong>
            <div className="booking-lines">
              <span>{listing.beds} bed</span>
              <span>{formatIndianNumber(listing.sqft)} sqft</span>
              <span>{locality}</span>
            </div>
            <button className="primary-detail-action" type="button">{listing.intent === "rent" ? "Request visit" : "Contact seller"}</button>
            <button className="secondary-detail-action" type="button" onClick={onMap}>Compare on map</button>
          </aside>
        </section>
      </main>
    </section>
  );
}

function MapScreen({ listings, selectedId, onSelect, onOpenListing, onBack, onSearchArea, mapAreaCount, liveStatus, searchCenter, onVisibleCountChange, search, setSearch, onMapSearch }) {
  const visibleCount = mapAreaCount ?? (searchCenter ? listings.length : listings[0]?.intent === "buy" ? 214 : 838);
  const resultRefs = useRef(new Map());

  useEffect(() => {
    if (!selectedId) return;
    const node = resultRefs.current.get(selectedId);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedId]);

  return (
    <section className="map-screen active" aria-label="Property map">
      <header className="map-topbar">
        <Brand asButton onClick={onBack} />
        <div className="map-search-cluster">
          <form className="air-search map-air-search" onSubmit={onMapSearch}>
            <LocationSearchSegment search={search} setSearch={setSearch} compact />
            <IntentSegment search={search} setSearch={setSearch} compact />
            <BudgetSegment search={search} setSearch={setSearch} compact />
            <button className="search-button" type="submit" aria-label="Search" />
          </form>
          <button className="filter-button" type="button">Filters</button>
        </div>
        <div className="host-actions map-actions">
          <button type="button">Saved homes</button>
          <button className="round-button" type="button" aria-label="Show list"><span aria-hidden="true" /></button>
        </div>
      </header>

      <section className="map-results-layout">
        <aside className="map-results-pane">
          <h1>{mapAreaCount == null ? visibleCount : mapAreaCount} homes within map area</h1>
          {liveStatus && <p className="map-area-note">{liveStatus}</p>}
          {(mapAreaCount != null || searchCenter) && <p className="map-area-note">Showing homes around the searched map area first.</p>}
          <div className="map-results-grid">
            {listings.map((listing, index) => (
              <MapResultCard
                key={listing.id}
                listing={listing}
                index={index}
                selected={listing.id === selectedId}
                onSelect={onSelect}
                onOpenListing={onOpenListing}
                resultRef={(node) => {
                  if (node) resultRefs.current.set(listing.id, node);
                  else resultRefs.current.delete(listing.id);
                }}
              />
            ))}
          </div>
        </aside>
        <LeafletMap
          listings={listings}
          selectedId={selectedId}
          onSelect={onSelect}
          onOpenListing={onOpenListing}
          onSearchArea={onSearchArea}
          searchCenter={searchCenter}
          onVisibleCountChange={onVisibleCountChange}
        />
      </section>

      <PropertySheet listing={listings.find((listing) => listing.id === selectedId)} onOpenListing={onOpenListing} />
    </section>
  );
}

function App() {
  const initialState = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const area = params.get("area") || "koregaon_park";
    const intent = params.get("intent") === "buy" ? "buy" : "rent";
    const budget = Number(params.get("budget")) || (intent === "buy" ? 20000000 : 65000);
    const listingId = Number(params.get("id"));
    const centerLat = Number(params.get("lat"));
    const centerLng = Number(params.get("lng"));
    const requestedView = params.get("view");
    return {
      screen: requestedView === "map" || requestedView === "property" ? requestedView : "home",
      selectedId: Number.isFinite(listingId) ? listingId : null,
      search: {
        area,
        intent,
        budget,
        beds: 1,
        locality: params.get("locality") || areaLabel(area),
        center: Number.isFinite(centerLat) && Number.isFinite(centerLng) ? [centerLat, centerLng] : AREA_CENTERS[area] ?? AREA_CENTERS.koregaon_park,
      },
    };
  }, []);

  const [search, setSearch] = useState(initialState.search);
  const [screen, setScreen] = useState(initialState.screen);
  const [selectedId, setSelectedId] = useState(initialState.selectedId);
  const [detailReturnScreen, setDetailReturnScreen] = useState(initialState.screen === "property" ? "map" : initialState.screen);
  const [areaRankedIds, setAreaRankedIds] = useState(null);
  const [mapAreaCount, setMapAreaCount] = useState(null);
  const [liveListings, setLiveListings] = useState([]);
  const [liveStatus, setLiveStatus] = useState("");
  const [liveLookupLocalities, setLiveLookupLocalities] = useState(null);
  const listingPool = useMemo(() => mergeListings(LISTINGS, liveListings), [liveListings]);

  const listings = useMemo(() => {
    const matches = getMatches(search, listingPool);
    if (!areaRankedIds) return matches;

    const rank = new Map(areaRankedIds.map((id, index) => [id, index]));
    return [...matches].sort((a, b) => {
      const rankA = rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER;
      const rankB = rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER;
      return rankA - rankB;
    });
  }, [areaRankedIds, listingPool, search]);

  useEffect(() => {
    if (screen !== "map") return undefined;
    const localities = liveLookupLocalities?.length ? liveLookupLocalities : [search.locality || areaLabel(search.area)];
    const cleanLocalities = [...new Set(localities.map((locality) => locality.trim()).filter((locality) => locality.length >= 3))];
    if (!cleanLocalities.length) return undefined;

    const controller = new AbortController();
    setLiveStatus(liveLookupLocalities?.length ? "Checking MagicBricks in map area..." : "Checking MagicBricks...");
    const timeout = window.setTimeout(async () => {
      try {
        const liveResults = [];
        const attempted = [];

        for (let index = 0; index < cleanLocalities.length; index += 3) {
          const batch = cleanLocalities.slice(index, index + 3);
          attempted.push(...batch);
          const results = await Promise.all(batch.map(async (locality) => {
            const params = new URLSearchParams({ locality, intent: search.intent });
            const response = await fetch(`/api/magicbricks?${params.toString()}`, { signal: controller.signal });
            if (!response.ok) return [];
            const data = await response.json();
            return data.listings ?? [];
          }));
          liveResults.push(...results.flat());
          if (liveResults.length) break;
        }

        const nextLiveListings = mergeListings([], liveResults);
        setLiveListings(nextLiveListings);
        setLiveStatus(nextLiveListings.length ? `MagicBricks live: ${nextLiveListings.length} from ${attempted.join(", ")}` : `No live MagicBricks matches after ${attempted.join(", ")}`);
      } catch (error) {
        if (error.name !== "AbortError") {
          setLiveListings([]);
          setLiveStatus("Using saved listings");
        }
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [screen, search.intent, search.locality, search.area, liveLookupLocalities]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("view", screen);
    params.set("area", search.area);
    params.set("intent", search.intent);
    params.set("budget", String(search.budget));
    if (search.locality) params.set("locality", search.locality);
    if (search.center) {
      params.set("lat", String(search.center[0]));
      params.set("lng", String(search.center[1]));
    }
    if (screen === "property" && selectedId) params.set("id", String(selectedId));
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [screen, search, selectedId]);

  function openMap(eventOrSearch) {
    const overrideSearch = eventOrSearch && !eventOrSearch.preventDefault ? eventOrSearch : null;
    eventOrSearch?.preventDefault?.();
    setAreaRankedIds(null);
    setMapAreaCount(null);
    setLiveLookupLocalities(null);
    setSearch((current) => {
      const next = overrideSearch ? { ...current, ...overrideSearch } : current;
      return { ...next, center: next.center ?? AREA_CENTERS[next.area] ?? PUNE_MAP_CENTER };
    });
    setSelectedId(null);
    setScreen("map");
  }

  function searchCurrentArea(bounds) {
    const matches = getMatches(search, listingPool);
    const inFrame = matches.filter((listing) => bounds.contains([listing.lat, listing.lng]));
    const outOfFrame = matches.filter((listing) => !bounds.contains([listing.lat, listing.lng]));
    const rankedIds = [...inFrame, ...outOfFrame].map((listing) => listing.id);
    const visibleLocalityLabels = getLiveLookupLocalitiesForBounds(bounds, inFrame);

    setAreaRankedIds(rankedIds);
    setMapAreaCount(inFrame.length);
    setSelectedId(null);
    setLiveLookupLocalities(visibleLocalityLabels);
  }

  function runMapSearch(event) {
    event.preventDefault();
    setAreaRankedIds(null);
    setMapAreaCount(null);
    setLiveLookupLocalities(null);
    setSelectedId(null);
  }

  function openListing(id, returnScreen = screen) {
    const listing = listingPool.find((item) => item.id === id);
    if (listing) {
      setSearch((current) => ({
        ...current,
        area: listing.area,
        intent: listing.intent,
        center: [listing.lat, listing.lng],
        budget: Math.max(current.budget, listing.price),
      }));
    }
    setSelectedId(id);
    setDetailReturnScreen(returnScreen === "property" ? "map" : returnScreen);
    setScreen("property");
  }

  function backFromListing() {
    setScreen(detailReturnScreen || "home");
  }

  function mapFromListing() {
    setAreaRankedIds(null);
    setMapAreaCount(null);
    setLiveLookupLocalities(null);
    setScreen("map");
  }

  return (
    <main className="app-shell">
      {screen === "home" && (
        <HomeScreen search={search} setSearch={setSearch} onSearch={openMap} onOpenListing={(id) => openListing(id, "home")} />
      )}
      {screen === "map" && (
        <MapScreen
          listings={listings}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onOpenListing={(id) => openListing(id, "map")}
          onBack={() => setScreen("home")}
          onSearchArea={searchCurrentArea}
          mapAreaCount={mapAreaCount}
          liveStatus={liveStatus}
          searchCenter={search.center}
          onVisibleCountChange={setMapAreaCount}
          search={search}
          setSearch={setSearch}
          onMapSearch={runMapSearch}
        />
      )}
      {screen === "property" && (
        <PropertyDetailPage
          listing={listingPool.find((listing) => listing.id === selectedId)}
          onBack={backFromListing}
          onMap={mapFromListing}
        />
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
