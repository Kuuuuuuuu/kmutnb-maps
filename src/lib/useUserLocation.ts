import { useEffect, useState } from "preact/hooks";
import type { LngLat } from "../types/geo";

type LocationState = {
  position: LngLat | null;
  accuracy: number | null;
  status: "idle" | "watching" | "denied" | "unavailable";
};

export function useUserLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    position: null,
    accuracy: null,
    status: "idle",
  });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setState((current) => ({ ...current, status: "unavailable" }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          position: [position.coords.longitude, position.coords.latitude],
          accuracy: position.coords.accuracy,
          status: "watching",
        });
      },
      (error) => {
        setState((current) => ({
          ...current,
          status:
            error.code === error.PERMISSION_DENIED ? "denied" : "unavailable",
        }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 12000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
