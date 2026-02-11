"""
AutoSleep CSV loader.

Reads the AutoSleep export (2016-2026, ~1181 nights) and produces a
daily DataFrame with standardized column names matching the COMPLE framework.

Columns in the AutoSleep CSV:
  ISO8601, fromDate, toDate, bedtime, waketime, inBed, awake, fellAsleepIn,
  sessions, asleep, asleepAvg7, efficiency, efficiencyAvg7, quality,
  qualityAvg7, deep, deepAvg7, sleepBPM, sleepBPMAvg7, dayBPM, dayBPMAvg7,
  wakingBPM, wakingBPMAvg7, hrv, hrvAvg7, sleepHRV, sleepHRVAvg7,
  SpO2Avg, SpO2Min, SpO2Max, respAvg, respMin, respMax, apnea, tags, notes
"""
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional


def _duration_to_minutes(val) -> Optional[float]:
    """Convert HH:MM:SS string to minutes."""
    if pd.isna(val) or val == '':
        return None
    try:
        parts = str(val).split(':')
        if len(parts) == 3:
            return int(parts[0]) * 60 + int(parts[1]) + int(parts[2]) / 60
        elif len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        return float(val)
    except (ValueError, TypeError):
        return None


def _extract_hour(dt_str) -> Optional[float]:
    """Extract decimal hour from datetime string (e.g., '2020-01-05 23:30:00' -> 23.5)."""
    if pd.isna(dt_str) or dt_str == '':
        return None
    try:
        dt = pd.to_datetime(dt_str)
        return dt.hour + dt.minute / 60
    except (ValueError, TypeError):
        return None


def load_autosleep(csv_path: str | Path) -> pd.DataFrame:
    """
    Load AutoSleep CSV and return a daily DataFrame.

    Returns DataFrame indexed by date with columns:
      - sleep_duration_hrs: total asleep time in hours
      - sleep_efficiency_pct: efficiency percentage
      - sleep_quality_score: quality in minutes (AutoSleep's quality metric)
      - deep_sleep_min: deep sleep in minutes
      - bedtime_hour: decimal hour of bedtime (e.g., 23.5 = 11:30 PM)
      - waketime_hour: decimal hour of wake time
      - time_in_bed_min: total time in bed in minutes
      - awake_min: awake time in minutes
      - fell_asleep_min: time to fall asleep in minutes
      - sleep_sessions: number of sleep sessions
      - sleep_hr_bpm: average heart rate during sleep
      - waking_hr_bpm: waking heart rate
      - day_hr_bpm: daytime heart rate
      - sleep_hrv_ms: HRV during sleep
      - hrv_ms: overall HRV
      - spo2_avg: average SpO2
      - spo2_min: minimum SpO2
      - resp_avg: average respiratory rate
      - sleep_hr_7d: 7-day avg sleep HR
      - sleep_hrv_7d: 7-day avg sleep HRV
    """
    df = pd.read_csv(csv_path)

    # Parse the date from ISO8601 column (mixed timezones, convert to UTC first)
    df['date'] = pd.to_datetime(df['ISO8601'], utc=True).dt.date

    result = pd.DataFrame()
    result['date'] = df['date']

    # Duration conversions
    result['sleep_duration_hrs'] = df['asleep'].apply(_duration_to_minutes).astype(float) / 60
    result['time_in_bed_min'] = df['inBed'].apply(_duration_to_minutes).astype(float)
    result['awake_min'] = df['awake'].apply(_duration_to_minutes).astype(float)
    result['fell_asleep_min'] = df['fellAsleepIn'].apply(_duration_to_minutes).astype(float)
    result['deep_sleep_min'] = df['deep'].apply(_duration_to_minutes).astype(float)
    result['sleep_quality_score'] = df['quality'].apply(_duration_to_minutes).astype(float)

    # Direct numeric columns
    result['sleep_efficiency_pct'] = pd.to_numeric(df['efficiency'], errors='coerce')
    result['sleep_sessions'] = pd.to_numeric(df['sessions'], errors='coerce')
    result['sleep_hr_bpm'] = pd.to_numeric(df['sleepBPM'], errors='coerce')
    result['waking_hr_bpm'] = pd.to_numeric(df['wakingBPM'], errors='coerce')
    result['day_hr_bpm'] = pd.to_numeric(df['dayBPM'], errors='coerce')
    result['sleep_hrv_ms'] = pd.to_numeric(df['sleepHRV'], errors='coerce')
    result['hrv_ms'] = pd.to_numeric(df['hrv'], errors='coerce')
    result['spo2_avg'] = pd.to_numeric(df['SpO2Avg'], errors='coerce')
    result['spo2_min'] = pd.to_numeric(df['SpO2Min'], errors='coerce')
    result['resp_avg'] = pd.to_numeric(df['respAvg'], errors='coerce')

    # 7-day averages (pre-computed by AutoSleep)
    result['sleep_hr_7d'] = pd.to_numeric(df['sleepBPMAvg7'], errors='coerce')
    result['sleep_hrv_7d'] = pd.to_numeric(df['sleepHRVAvg7'], errors='coerce')
    result['sleep_efficiency_7d'] = pd.to_numeric(df['efficiencyAvg7'], errors='coerce')
    result['deep_sleep_7d'] = df['deepAvg7'].apply(_duration_to_minutes).astype(float)

    # Bedtime and wake time as decimal hours
    result['bedtime_hour'] = df['bedtime'].apply(_extract_hour)
    result['waketime_hour'] = df['waketime'].apply(_extract_hour)

    # Tags and notes
    result['sleep_tags'] = df['tags'].fillna('')
    result['sleep_notes'] = df['notes'].fillna('')

    # Derived: sleep debt (deviation from 7.5h target, accumulated over 14 days)
    target_sleep = 7.5
    result['sleep_deficit'] = target_sleep - result['sleep_duration_hrs']
    result['sleep_debt_14d'] = result['sleep_deficit'].rolling(14, min_periods=1).sum()

    # Set index
    result['date'] = pd.to_datetime(result['date'])
    result = result.set_index('date').sort_index()

    # Drop rows with no sleep data at all
    result = result.dropna(subset=['sleep_duration_hrs'], how='all')

    return result


if __name__ == "__main__":
    import sys
    from inference_engine.config import AUTOSLEEP_CSV

    path = sys.argv[1] if len(sys.argv) > 1 else str(AUTOSLEEP_CSV)
    df = load_autosleep(path)
    print(f"Loaded {len(df)} nights from AutoSleep")
    print(f"Date range: {df.index.min()} to {df.index.max()}")
    print(f"\nColumns ({len(df.columns)}):")
    for col in df.columns:
        non_null = df[col].notna().sum()
        print(f"  {col:30s}  {non_null:5d} values  ({non_null/len(df)*100:.0f}%)")
    print(f"\nSample (last 5 nights):")
    print(df[['sleep_duration_hrs', 'sleep_efficiency_pct', 'deep_sleep_min',
              'sleep_hrv_ms', 'bedtime_hour']].tail())
