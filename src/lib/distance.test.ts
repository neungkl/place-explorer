import { describe, expect, it } from "vitest";
import { haversineKm } from "./distance";

describe("haversineKm", () => {
  it("is zero for the same point", () => {
    expect(haversineKm({ lat: 13.7563, lng: 100.5018 }, { lat: 13.7563, lng: 100.5018 })).toBe(0);
  });

  it("matches the known Bangkok–Tokyo great-circle distance", () => {
    const bangkok = { lat: 13.7563, lng: 100.5018 };
    const tokyo = { lat: 35.6762, lng: 139.6503 };
    // Widely cited great-circle distance is ~4600 km; allow a little slack
    // for the reference points used.
    expect(haversineKm(bangkok, tokyo)).toBeGreaterThan(4500);
    expect(haversineKm(bangkok, tokyo)).toBeLessThan(4700);
  });

  it("is symmetric", () => {
    const a = { lat: 13.7563, lng: 100.5018 };
    const b = { lat: 10.0956, lng: 99.8403 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 10);
  });

  it("handles antipodal-ish points without NaN", () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 0, lng: 180 };
    expect(haversineKm(a, b)).toBeCloseTo(Math.PI * 6371, 0);
  });
});
