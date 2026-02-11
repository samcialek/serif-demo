"""
GPX batch parser.
Parses workout route files, extracts per-workout features.
"""
import math
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

from inference_engine.config import GPX_DIR, VT1_SPEED_KMH


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance in meters between two GPS points."""
    R = 6371000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _parse_single_gpx(filepath: Path) -> Optional[dict]:
    """
    Parse a single GPX file without gpxpy dependency (pure XML parsing).
    Falls back gracefully on malformed files.
    """
    import xml.etree.ElementTree as ET

    try:
        tree = ET.parse(str(filepath))
    except (ET.ParseError, Exception):
        return None

    root = tree.getroot()
    # Handle GPX namespace
    ns = ""
    if root.tag.startswith("{"):
        ns = root.tag.split("}")[0] + "}"

    points = []
    for trkpt in root.iter(f"{ns}trkpt"):
        lat = float(trkpt.get("lat", 0))
        lon = float(trkpt.get("lon", 0))
        ele = None
        time_str = None

        ele_elem = trkpt.find(f"{ns}ele")
        if ele_elem is not None and ele_elem.text:
            try:
                ele = float(ele_elem.text)
            except ValueError:
                pass

        time_elem = trkpt.find(f"{ns}time")
        if time_elem is not None and time_elem.text:
            time_str = time_elem.text

        points.append({"lat": lat, "lon": lon, "ele": ele, "time": time_str})

    if len(points) < 2:
        return None

    # Parse timestamps
    timestamps = []
    for p in points:
        if p["time"]:
            try:
                # Handle ISO format with Z or +00:00
                ts = p["time"].replace("Z", "+00:00")
                dt = datetime.fromisoformat(ts)
                timestamps.append(dt)
            except (ValueError, TypeError):
                timestamps.append(None)
        else:
            timestamps.append(None)

    # Filter to points with valid timestamps
    valid = [(p, t) for p, t in zip(points, timestamps) if t is not None]
    if len(valid) < 2:
        return None

    points_valid = [v[0] for v in valid]
    times_valid = [v[1] for v in valid]

    # Compute distance (sum of haversine segments)
    total_distance = 0.0
    segment_speeds = []
    elevation_gains = 0.0

    for i in range(1, len(points_valid)):
        d = _haversine(
            points_valid[i - 1]["lat"], points_valid[i - 1]["lon"],
            points_valid[i]["lat"], points_valid[i]["lon"],
        )
        total_distance += d

        dt_sec = (times_valid[i] - times_valid[i - 1]).total_seconds()
        if dt_sec > 0:
            speed_kmh = (d / dt_sec) * 3.6
            if speed_kmh < 60:  # Filter GPS noise
                segment_speeds.append(speed_kmh)

        # Elevation gain
        if points_valid[i]["ele"] is not None and points_valid[i - 1]["ele"] is not None:
            ele_diff = points_valid[i]["ele"] - points_valid[i - 1]["ele"]
            if ele_diff > 0:
                elevation_gains += ele_diff

    # Duration
    start_time = times_valid[0]
    end_time = times_valid[-1]
    duration_sec = (end_time - start_time).total_seconds()
    if duration_sec <= 0:
        return None

    duration_min = duration_sec / 60
    distance_km = total_distance / 1000
    avg_speed = np.mean(segment_speeds) if segment_speeds else 0
    max_speed = np.percentile(segment_speeds, 95) if len(segment_speeds) > 5 else (max(segment_speeds) if segment_speeds else 0)

    # Classify workout type from speed profile
    median_speed = np.median(segment_speeds) if segment_speeds else 0
    if median_speed < 7:
        workout_type = "walking"
    elif median_speed < 20:
        workout_type = "running"
    elif median_speed < 50:
        workout_type = "cycling"
    else:
        workout_type = "other"

    # Classify intensity relative to VT1
    if workout_type == "running":
        if avg_speed < VT1_SPEED_KMH * 0.8:
            intensity = "easy"
        elif avg_speed < VT1_SPEED_KMH:
            intensity = "zone2"
        elif avg_speed < VT1_SPEED_KMH * 1.05:
            intensity = "threshold"
        else:
            intensity = "high"
    elif workout_type == "cycling":
        # Approximate cycling intensity
        if avg_speed < 22:
            intensity = "easy"
        elif avg_speed < 30:
            intensity = "zone2"
        else:
            intensity = "threshold"
    else:
        intensity = "easy"

    # Determine location from GPS coordinates (Israel vs US)
    avg_lat = np.mean([p["lat"] for p in points_valid])
    avg_lon = np.mean([p["lon"] for p in points_valid])
    if 29 < avg_lat < 34 and 34 < avg_lon < 36:
        location = "israel"
    else:
        location = "us"

    # Time of day classification
    hour = start_time.hour
    if hour < 6:
        time_of_day = "early_morning"
    elif hour < 10:
        time_of_day = "morning"
    elif hour < 14:
        time_of_day = "midday"
    elif hour < 18:
        time_of_day = "afternoon"
    else:
        time_of_day = "evening"

    return {
        "date": start_time.strftime("%Y-%m-%d"),
        "start_time": start_time.isoformat(),
        "duration_min": round(duration_min, 1),
        "distance_km": round(distance_km, 2),
        "avg_speed_kmh": round(avg_speed, 1),
        "max_speed_kmh": round(max_speed, 1),
        "elevation_gain_m": round(elevation_gains, 0),
        "workout_type": workout_type,
        "intensity": intensity,
        "location": location,
        "time_of_day": time_of_day,
        "hour": hour,
        "avg_lat": round(avg_lat, 4),
        "avg_lon": round(avg_lon, 4),
        "n_points": len(points_valid),
        "filename": filepath.name,
    }


def parse_all_gpx(gpx_dir: Optional[Path] = None) -> pd.DataFrame:
    """
    Parse all GPX files in the workout-routes directory.

    Returns a DataFrame with one row per workout, sorted by date.
    """
    gpx_dir = gpx_dir or GPX_DIR

    if not gpx_dir.exists():
        print(f"GPX directory not found: {gpx_dir}")
        return pd.DataFrame()

    gpx_files = sorted(gpx_dir.glob("*.gpx"))
    print(f"Found {len(gpx_files)} GPX files")

    results = []
    errors = 0
    for i, fp in enumerate(gpx_files):
        if (i + 1) % 100 == 0:
            print(f"  Parsed {i + 1}/{len(gpx_files)}...")
        result = _parse_single_gpx(fp)
        if result:
            results.append(result)
        else:
            errors += 1

    print(f"Successfully parsed {len(results)} workouts ({errors} errors)")

    if not results:
        return pd.DataFrame()

    df = pd.DataFrame(results)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    return df
