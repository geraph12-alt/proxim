import { useState, useEffect, useRef } from "react";

const GOOGLE_MAPS_KEY = "AIzaSyDPNTg7ZgiwCHEx1n0ALQ14H1mRQaIGBTI";

const SERVICES = [
  { label: "General Cleaning", sublabel: "Limpieza", emoji: "🧹", value: "cleaning" },
  { label: "Plumbing", sublabel: "Fontanería", emoji: "🔧", value: "plumbing" },
  { label: "Electrical", sublabel: "Electricistas", emoji: "⚡", value: "electrician" },
  { label: "AC & HVAC", sublabel: "Aire Acondicionado", emoji: "❄️", value: "aircon" },
  { label: "Handyman", sublabel: "Manitas", emoji: "🔨", value: "painting" },
  { label: "Pest Control", sublabel: "Control de Plagas", emoji: "🐜", value: "pest_control" },
  { label: "Landscaping", sublabel: "Paisajismo", emoji: "🌱", value: "landscaping" },
  { label: "Pool Maintenance", sublabel: "Mantenimiento de Piscinas", emoji: "🏊", value: "pool_maintenance" },
];

// Load Google Maps script once
function AddressInput({ onAddressSelect }) {
  const inputRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (document.querySelector("#gmaps-script")) {
      setLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "gmaps-script";
    script.src = "https://maps.googleapis.com/maps/api/js?key=" + GOOGLE_MAPS_KEY + "&libraries=places&v=quarterly";
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!loaded || !inputRef.current) return;
    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        componentRestrictions: { country: "es" },
        fields: ["formatted_address", "geometry"],
      }
    );
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        onAddressSelect({
          address: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }
    });
  }, [loaded]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Address / Dirección"
      style={{
        width: "100%",
        padding: "14px 18px",
        fontSize: "15px",
        border: "2px solid #e5e7eb",
        borderRadius: "14px",
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "system-ui, sans-serif",
      }}
    />
  );
}
// Calculate distance between two coordinates in km
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Star rating display
function Stars({ rating }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} style={{ color: star <= Math.round(rating) ? "#f59e0b" : "#d1d5db", fontSize: "16px" }}>★</span>
      ))}
      <span style={{ color: "#6b7280", fontSize: "13px", marginLeft: "4px" }}>{rating}</span>
    </div>
  );
}

// Company card with address and Google Maps link
function CompanyCard({ company, index, userLocation }) {
  const isWhatsApp = company.contactType === "whatsapp";

  // Calculate distance if user provided their address
  const distance = userLocation
    ? getDistanceKm(userLocation.lat, userLocation.lng, company.lat, company.lng).toFixed(1)
    : null;

  // Google Maps link for this company
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.address)}`;

  return (
    <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #f0f0f0", position: "relative" }}>

      {/* Top color bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: "16px 16px 0 0" }} />

      {/* Rank badge */}
      <div style={{ position: "absolute", top: "16px", right: "16px", width: "28px", height: "28px", borderRadius: "50%", background: index === 0 ? "#fbbf24" : "#e5e7eb", color: index === 0 ? "#92400e" : "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700" }}>
        #{index + 1}
      </div>

      {/* Company name */}
      <h3 style={{ margin: "8px 0 8px", fontSize: "18px", fontWeight: "700", color: "#111827" }}>{company.name}</h3>

      {/* Stars */}
      <Stars rating={company.rating} />
      <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#9ca3af" }}>{company.reviews} reviews</p>

      {/* Address — clickable, opens Google Maps */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px", color: "#6366f1", fontSize: "13px", textDecoration: "none" }}
      >
        <span>📍</span>
        <span style={{ textDecoration: "underline" }}>{company.address}</span>
      </a>

      {/* Distance from user — only shows if user entered their address */}
      {distance && (
        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#10b981", fontWeight: "600" }}>
          🚗 {distance} km from you
        </p>
      )}

      {/* Price */}
      <div style={{ marginTop: "14px", padding: "10px 14px", background: "#f0fdf4", borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
        <span>💰</span>
        <span style={{ fontWeight: "600", color: "#166534" }}>{company.priceRange}</span>
      </div>

      {/* Contact button */}
      <a
        href={company.contact}
        target="_blank"
        rel="noopener noreferrer"
        style={{ marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", borderRadius: "10px", background: isWhatsApp ? "linear-gradient(135deg, #25d366, #128c7e)" : "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", fontWeight: "600", fontSize: "14px", textDecoration: "none" }}
      >
        {isWhatsApp ? "💬 WhatsApp" : "📞 Call Now"}
      </a>
    </div>
  );
}

// What AI understood badge
function ParsedBadge({ parsed }) {
  const icons = { cleaning: "🧹", plumbing: "🔧", aircon: "❄️", painting: "🎨", electrician: "⚡", unknown: "❓" };
  return (
    <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "12px", padding: "14px 20px", marginBottom: "24px", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
      <span style={{ fontSize: "13px", color: "#7c3aed", fontWeight: "600" }}>🤖 AI understood:</span>
      {[
        `${icons[parsed.service] || "🔨"} ${parsed.service}`,
        `📍 ${parsed.location}`,
        `💸 ${parsed.budget}`,
        `⏰ ${parsed.urgency}`,
      ].map((tag) => (
        <span key={tag} style={{ background: "white", border: "1px solid #ede9fe", borderRadius: "20px", padding: "4px 12px", fontSize: "13px", color: "#4c1d95" }}>{tag}</span>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #f0f0f0" }}>
      <div style={{ height: "20px", background: "#f3f4f6", borderRadius: "8px", marginBottom: "12px", animation: "pulse 1.5s infinite" }} />
      <div style={{ height: "14px", background: "#f3f4f6", borderRadius: "8px", width: "60%", marginBottom: "8px", animation: "pulse 1.5s infinite" }} />
      <div style={{ height: "14px", background: "#f3f4f6", borderRadius: "8px", width: "40%", marginBottom: "16px", animation: "pulse 1.5s infinite" }} />
      <div style={{ height: "36px", background: "#f3f4f6", borderRadius: "8px", animation: "pulse 1.5s infinite" }} />
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}

// Main App
export default function App() {
  const [query, setQuery] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

async function handleSearch(serviceValue) {
  setSelectedService(serviceValue);
  setLoading(true);
  setError(null);
  setResults(null);
  setParsed(null);

  try {
    const res = await fetch("https://proxim-production-e113.up.railway.app", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: serviceValue + " in " + (userLocation ? userLocation.address : "madrid") }),
    });
    if (!res.ok) throw new Error("Server error");
    const data = await res.json();
    setParsed(data.parsed);

    if (userLocation) {
      const withDistance = data.results.map((company) => ({
        ...company,
        distance: getDistanceKm(userLocation.lat, userLocation.lng, company.lat, company.lng),
      }));
      withDistance.sort((a, b) => a.distance - b.distance);
      setResults(withDistance);
    } else {
      setResults(data.results);
    }
  } catch (err) {
    setError("Cannot connect to server. Make sure the backend is running.");
  } finally {
    setLoading(false);
  }
}

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8f7ff, #f0f4ff)", fontFamily: "system-ui, sans-serif", padding: "0 16px 60px" }}>

      {/* Header */}
      <div style={{ textAlign: "center", paddingTop: "60px", paddingBottom: "40px" }}>
        <div style={{ fontSize: "100px", marginBottom: "0px" }}>🏘</div>
        <h1 style={{ fontSize: "36px", fontWeight: "800", color: "#111827", margin: "0 0 12px" }}>APP YOUR SERVICE</h1>
        <p style={{ color: "#6b7280", fontSize: "16px" }}>Find the nearest home service near you</p>
      </div>

      {/* Search area */}
      <div style={{ maxWidth: "640px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "12px" }}>
{/* How it works section */}
<div style={{ maxWidth: "700px", margin: "0px auto 0", textAlign: "center" }}>
  <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#111827", marginBottom: "8px" }}>How it works</h2>
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
    {[
      { emoji: "📍", title: "Enter your address", desc: "Type your location so we can find pros near you" },
      { emoji: "🔍", title: "Choose a service", desc: "Pick what you need from our list of services" },
      { emoji: "📞", title: "Contact the best pro", desc: "Call or WhatsApp the desired contact" },
    ].map((step, i) => (
      <div key={i} style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
        <div style={{ fontSize: "36px", marginBottom: "12px" }}>{step.emoji}</div>
        <div style={{ fontWeight: "700", fontSize: "15px", color: "#111827", marginBottom: "8px" }}>{step.title}</div>
        <div style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.5" }}>{step.desc}</div>
      </div>
    ))}
  </div>
</div>
        {/* Address input */}
        <AddressInput onAddressSelect={setUserLocation} />

        {/* Show selected address confirmation */}
        {userLocation && (
          <p style={{ fontSize: "13px", color: "#10b981", margin: "0", paddingLeft: "4px" }}>
            ✅ Address set — results will be sorted by distance from you
          </p>
        )}

        {/* Service buttons */}
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginTop: "8px" }}>
  {SERVICES.map((service) => (
    <button
      key={service.value}
      onClick={() => handleSearch(service.value)}
      disabled={loading}
      style={{
        padding: "16px 12px",
        borderRadius: "16px",
        border: "2px solid " + (selectedService === service.value ? "#6366f1" : "#e5e7eb"),
        background: "white",
        cursor: loading ? "not-allowed" : "pointer",
        textAlign: "center",
        transition: "all 0.2s",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = "#6366f1";
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.2)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = "#e5e7eb";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
      }}
    >
      <div style={{ fontSize: "28px", marginBottom: "6px" }}>{service.emoji}</div>
      <div style={{ fontWeight: "700", fontSize: "13px", color: "#111827" }}>{service.label}</div>
      <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>{service.sublabel}</div>
    </button>
  ))}
</div>

      {/* Loading */}
      {loading && (
  <div style={{ maxWidth: "900px", margin: "40px auto 0" }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
)}
      {/* Error */}
      {error && (
        <div style={{ maxWidth: "640px", margin: "40px auto 0", padding: "16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", color: "#dc2626", textAlign: "center" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      {results && parsed && (
        <div style={{ maxWidth: "900px", margin: "40px auto 0" }}>
          <ParsedBadge parsed={parsed} />
          <p style={{ color: "#6b7280", marginBottom: "20px", fontSize: "14px" }}>
            Found <strong style={{ color: "#111827" }}>{results.length} pros</strong>
            {userLocation ? " — sorted by distance from you" : " matching your request"}
          </p>
          {results.length === 0 && (
  <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: "16px", marginTop: "16px" }}>
    <div style={{ fontSize: "48px", marginBottom: "12px" }}>😕</div>
    <h3 style={{ color: "#111827", margin: "0 0 8px" }}>No pros found nearby</h3>
    <p style={{ color: "#6b7280", fontSize: "14px" }}>Try selecting a different service or check back later.</p>
  </div>
)}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            {results.map((company, i) => (
              <CompanyCard key={company.id} company={company} index={i} userLocation={userLocation} />
            ))}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
