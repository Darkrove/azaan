"use client";

import { useEffect, useState } from "react";
import {
  fetchTimingsByCoords,
  getRecommendedMethod,
  getRecommendedSchool,
} from "../lib/api";
import { guessLocation } from "../lib/geo";

// Use the shared type from API helpers
import type { PrayerTimings } from "../lib/api";

// ui components for settings panel
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "./ui/field";
import { Switch } from "./ui/switch";

// drawer UI components
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "./ui/drawer";
import { Button } from "./ui/button";

// local alias for readability
type Timings = PrayerTimings;

const emojis: Record<string, string> = {
  Fajr: "🌅",
  Sunrise: "☀️",
  Dhuhr: "🌞",
  Asr: "🌤️",
  Maghrib: "🌇",
  Isha: "🌙",
};

const descriptions: Record<string, string> = {
  Fajr: "Dawn prayer",
  Dhuhr: "Noon prayer",
  Asr: "Afternoon prayer",
  Maghrib: "Sunset prayer",
  Isha: "Night prayer",
};

export default function PrayerTimes() {
  const [timings, setTimings] = useState<Timings | null>(null);
  const [timezone, setTimezone] = useState<string>("");
  const [locationSource, setLocationSource] = useState<string>("");
  const [locationLabel, setLocationLabel] = useState<string>("");
  const [overrideSchool, setOverrideSchool] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [countryInfo, setCountryInfo] = useState<{
    country?: string;
    tz?: string;
  } | null>(null);
  const [selectedPrayer, setSelectedPrayer] = useState<string>("Fajr");
  const [currentPrayer, setCurrentPrayer] = useState<string | null>(null);
  const [autoSelect, setAutoSelect] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // theme toggle state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((t) => !t);

  // helper to load timings; defined outside effects so it always sees the latest state values
  const fetchData = async (
    lat: number,
    lng: number,
    country?: string,
    tz?: string,
  ) => {
    try {
      const method = country
        ? (getRecommendedMethod(country) ?? undefined)
        : undefined;
      let school =
        overrideSchool !== null
          ? overrideSchool
          : country
            ? getRecommendedSchool(country)
            : undefined;
      const data = await fetchTimingsByCoords({
        latitude: lat,
        longitude: lng,
        method,
        school,
        timezone: tz,
      });
      setTimings(data.timings);
      setTimezone(data.meta?.timezone ?? tz ?? "");
    } catch (e) {
      console.error(e);
      setError("Could not load timings");
    }
  };

  useEffect(() => {
    const tryIpLocation = async () => {
      const loc = await guessLocation();
      if (loc) {
        setLocationSource("IP location");
        setLocationLabel(`${loc.city}, ${loc.country}`);
        setCoords({ lat: loc.latitude, lng: loc.longitude });
        setCountryInfo({ country: loc.country, tz: loc.timezone });
        fetchData(loc.latitude, loc.longitude, loc.country, loc.timezone);
      } else {
        setLocationSource("fallback (Mecca)");
        // still set coords so school changes trigger refetch
        setCoords({ lat: 21.3891, lng: 39.8579 });
        setCountryInfo(null);
        fetchData(21.3891, 39.8579);
      }
    };

    // read override school from storage
    const stored = localStorage.getItem("school");
    if (stored !== null) setOverrideSchool(Number(stored));

    // listen for changes from settings page or other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "school") {
        setOverrideSchool(e.newValue ? Number(e.newValue) : null);
      }
    };
    window.addEventListener("storage", handleStorage);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setLocationSource("device GPS");
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const loc = await guessLocation();
          setCoords({ lat, lng });
          if (loc) {
            setLocationLabel(`${loc.city}, ${loc.country}`);
            setCountryInfo({ country: loc.country, tz: loc.timezone });
            fetchData(lat, lng, loc.country, loc.timezone);
          } else {
            setCountryInfo(null);
            fetchData(lat, lng);
          }
        },
        () => {
          tryIpLocation();
        },
      );
    } else {
      tryIpLocation();
    }

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // compute current + next prayer and countdown; update periodically
  const [nextDiff, setNextDiff] = useState<string>("");

  const calcDiff = (prayer: string): string => {
    if (!timings) return "";
    const now = new Date();
    const [h, m] = timings[prayer as keyof PrayerTimings]
      .split(":")
      .map(Number);
    let target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    const diffMs = target.getTime() - now.getTime();
    const mins = Math.ceil(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hrs > 0 ? hrs + "h " : ""}${rem}m`;
  };

  const computeCurrentNext = () => {
    if (!timings) return;
    const now = new Date();
    const order = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
    let next: string | null = null;
    let current: string | null = null;
    for (let i = 0; i < order.length; i++) {
      const p = order[i];
      const val = timings[p as keyof PrayerTimings];
      const [h, m] = val.split(":").map(Number);
      const t = new Date(now);
      t.setHours(h, m, 0, 0);
      if (t > now) {
        next = p;
        current = i > 0 ? order[i - 1] : null;
        break;
      }
    }
    if (autoSelect) {
      setSelectedPrayer(next || order[0]);
    }
    setCurrentPrayer(current);
    // countdown based on mode
    if (autoSelect && next) {
      setNextDiff(calcDiff(next));
    } else {
      setNextDiff(calcDiff(selectedPrayer));
    }
  };

  useEffect(() => {
    computeCurrentNext();
    const iv = setInterval(computeCurrentNext, 30000);
    return () => clearInterval(iv);
  }, [timings, selectedPrayer, autoSelect]);

  // refetch timings when override school or location changes
  useEffect(() => {
    if (coords) {
      const { lat, lng } = coords;
      fetchData(lat, lng, countryInfo?.country, countryInfo?.tz);
    }
  }, [overrideSchool, coords, countryInfo]);

  const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const handleNav = (p: string) => {
    setSelectedPrayer(p);
    setAutoSelect(false);
  };

  // handle option selection from drawer
  const handleSchoolChange = (val: number) => {
    setOverrideSchool(val);
    localStorage.setItem("school", String(val));
  };

  // determine which school should appear checked (default to Shafi = 0)
  const selectedSchool = overrideSchool !== null ? overrideSchool : 0;

  return (
    <Drawer open={showSettings} onOpenChange={setShowSettings}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Settings</DrawerTitle>
            <DrawerDescription>Choose calculation method</DrawerDescription>
          </DrawerHeader>
          <FieldGroup className="p-4">
            <FieldLabel htmlFor="switch-shafi">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Shafi</FieldTitle>
                  <FieldDescription>
                    The Shafi school calculation method.
                  </FieldDescription>
                </FieldContent>
                <Switch
                  id="switch-shafi"
                  checked={selectedSchool === 0}
                  onCheckedChange={(checked) =>
                    checked && handleSchoolChange(0)
                  }
                />
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor="switch-hanafi">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Hanafi</FieldTitle>
                  <FieldDescription>
                    The Hanafi school calculation method.
                  </FieldDescription>
                </FieldContent>
                <Switch
                  id="switch-hanafi"
                  checked={selectedSchool === 1}
                  onCheckedChange={(checked) =>
                    checked && handleSchoolChange(1)
                  }
                />
              </Field>
            </FieldLabel>
          </FieldGroup>
        </div>
      </DrawerContent>

      <div className="flex h-screen flex-col relative">
        {/* floating label with location and theme toggle */}
        <div className="absolute w-full top-4 z-10 flex items-center justify-between px-4 py-2">
          <Button variant="outline" className="pointer-events-none">
            {locationLabel || timezone || "Loading location..."}
          </Button>
          <Button
            onClick={toggleTheme}
            variant="outline"
            className="rounded-full"
            size="icon"
          >
            {darkMode ? "☀️" : "🌙"}
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center pt-12">
          {error && <p className="text-red-500">{error}</p>}
          {!timings && !error && <p>Loading prayer times…</p>}

          {timings && selectedPrayer && (
            <div className="text-center">
              <div className="text-6xl font-bold">
                {timings[selectedPrayer as keyof PrayerTimings]}
              </div>
              <div className="text-2xl mt-2">
                {emojis[selectedPrayer]} {selectedPrayer}
              </div>
              <div className="mt-1 text-sm text-secondary-foreground">
                {descriptions[selectedPrayer] || ""}
              </div>
              {/* show hidden meta info if needed */}
            </div>
          )}

          {/* current/next display */}
          {timings && (
            <div className="mt-8 w-full px-8 flex flex-col items-center space-y-4">
              {currentPrayer && (
                <div className="w-full py-2 px-4 border rounded-full text-left text-primary">
                  <span className="font-semibold">
                    {emojis[currentPrayer]} {currentPrayer}
                  </span>
                  <span className="ml-2 text-xs">current</span>
                </div>
              )}
              {selectedPrayer && selectedPrayer !== currentPrayer && (
                <div className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-full text-left">
                  <span className="font-semibold">
                    {emojis[selectedPrayer]} {selectedPrayer}
                  </span>
                  <span className="ml-2 text-xs">in {nextDiff}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom navigation */}
        <nav className="border bg-secondary ">
          <ul className="flex justify-around p-2">
            {prayers.map((p) => (
              <li key={p} className="flex-1">
                <button
                  onClick={() => handleNav(p)}
                  className={`w-full p-3 flex flex-col items-center justify-center space-y-1 text-sm transition-colors
                  ${
                    selectedPrayer === p
                      ? "text-secondary-foreground bg-primary rounded-xl"
                      : "text-primary-foreground hover:text-primary-foreground/80"
                  }`}
                >
                  <span className="text-xl">{emojis[p]}</span>
                  <span>{p}</span>
                </button>
              </li>
            ))}
            <li className="flex-1">
              <DrawerTrigger asChild>
                <button className="w-full p-3 flex flex-col items-center justify-center space-y-1 text-sm text-primary-foreground hover:text-primary-foreground/80">
                  <span className="text-xl">⚙️</span>
                  <span>Settings</span>
                </button>
              </DrawerTrigger>
            </li>
          </ul>
        </nav>
      </div>
    </Drawer>
  );
}
