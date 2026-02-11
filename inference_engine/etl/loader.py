"""
Lab results + Medix data loader.
Reads structured JSON from OCR extraction, pivots to wide-format DataFrames.
"""
import json
import re
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

from inference_engine.config import LAB_RESULTS_PATH, MEDIX_DATA_PATH


def _parse_value(raw: str) -> Optional[float]:
    """Parse a lab value string, handling thresholds like '<0.2' and '>18.4'."""
    if not raw or raw.strip() == "":
        return None
    raw = raw.strip()
    # Handle threshold values
    if raw.startswith("<"):
        val = re.search(r"[\d.]+", raw)
        return float(val.group()) * 0.5 if val else None  # Impute at half the threshold
    if raw.startswith(">"):
        val = re.search(r"[\d.]+", raw)
        return float(val.group()) if val else None
    try:
        return float(raw)
    except ValueError:
        return None


def _normalize_test_name(test: str) -> str:
    """Normalize test names to consistent snake_case keys."""
    mapping = {
        "GLUCOSE": "glucose",
        "UREA NITROGEN (BUN)": "bun",
        "CREATININE": "creatinine",
        "EGFR": "egfr",
        "SODIUM": "sodium",
        "POTASSIUM": "potassium",
        "CHLORIDE": "chloride",
        "CARBON DIOXIDE": "co2",
        "CALCIUM": "calcium",
        "PROTEIN, TOTAL": "total_protein",
        "ALBUMIN": "albumin",
        "GLOBULIN": "globulin",
        "BILIRUBIN, TOTAL": "bilirubin_total",
        "ALKALINE PHOSPHATASE": "alp",
        "AST": "ast",
        "ALT": "alt",
        "WHITE BLOOD CELL COUNT": "wbc",
        "RED BLOOD CELL COUNT": "rbc",
        "HEMOGLOBIN": "hemoglobin",
        "HEMATOCRIT": "hematocrit",
        "MCV": "mcv",
        "MCH": "mch",
        "MCHC": "mchc",
        "RDW": "rdw",
        "PLATELET COUNT": "platelets",
        "MPV": "mpv",
        "HS CRP": "hscrp",
        "INSULIN": "insulin",
        "CHOLESTEROL, TOTAL": "total_cholesterol",
        "HDL CHOLESTEROL": "hdl",
        "TRIGLYCERIDES": "triglycerides",
        "LDL-CHOLESTEROL": "ldl",
        "CHOL/HDLC RATIO": "chol_hdl_ratio",
        "NON HDL CHOLESTEROL": "non_hdl_cholesterol",
        "IRON, TOTAL": "iron_total",
        "IRON BINDING CAPACITY": "tibc",
        "IRON SATURATION": "iron_saturation_pct",
        "FERRITIN": "ferritin",
        "URIC ACID": "uric_acid",
        "TSH": "tsh",
        "TESTOSTERONE, TOTAL, MS": "testosterone",
        "TESTOSTERONE,TOTAL,MS": "testosterone",
        "EPA": "epa",
        "DPA": "dpa",
        "DHA": "dha",
        "ARACHIDONIC ACID": "arachidonic_acid",
        "ARACHIDONIC ACID/EPA RATIO": "aa_epa_ratio",
        "LINOLEIC ACID": "linoleic_acid",
        "APOLIPOPROTEIN B": "apob",
        "MAGNESIUM, RBC": "magnesium_rbc",
        "VITAMIN D,25-OH,TOTAL,IA": "vitamin_d",
        "CORTISOL, TOTAL, LC/MS": "cortisol",
        "HEMOGLOBIN A1C": "hba1c",
        "DHEA SULFATE": "dhea_s",
        "SPECIFIC GRAVITY": "urine_specific_gravity",
        "SEX HORMONE BINDING GLOBULIN": "shbg",
        "FREE TESTOSTERONE": "free_testosterone",
        "TESTOSTERONE, FREE": "free_testosterone",
        "ALBUMIN/GLOBULIN RATIO": "ag_ratio",
        "VITAMIN B12": "b12",
        "FOLATE, SERUM": "folate",
        "GGT": "ggt",
        # CBC differentials — absolute counts
        "ABSOLUTE NEUTROPHILS": "neutrophils_abs",
        "ABSOLUTE LYMPHOCYTES": "lymphocytes_abs",
        "ABSOLUTE MONOCYTES": "monocytes_abs",
        "ABSOLUTE EOSINOPHILS": "eosinophils_abs",
        "ABSOLUTE BASOPHILS": "basophils_abs",
        # CBC differentials — percentages
        "NEUTROPHILS": "neutrophils_pct",
        "LYMPHOCYTES": "lymphocytes_pct",
        "MONOCYTES": "monocytes_pct",
        "EOSINOPHILS": "eosinophils_pct",
        "BASOPHILS": "basophils_pct",
        # Advanced lipids
        "LDL PARTICLE NUMBER": "ldl_particle_number",
        "LDL SMALL": "ldl_small",
        "LDL MEDIUM": "ldl_medium",
        "LDL PEAK SIZE": "ldl_peak_size",
        "HDL LARGE": "hdl_large",
        # Metabolic
        "HOMOCYSTEINE": "homocysteine",
        "BUN/CREATININE RATIO": "bun_creatinine_ratio",
        "AMYLASE": "amylase",
        "LIPASE": "lipase",
        "LEPTIN": "leptin",
        "METHYLMALONIC ACID": "methylmalonic_acid",
        # Hormones
        "ESTRADIOL": "estradiol",
        "FSH": "fsh",
        "PROLACTIN": "prolactin",
        "PSA, TOTAL": "psa_total",
        "PSA, FREE": "psa_free",
        # Thyroid — free hormones
        "T4, FREE": "free_t4",
        "T3, FREE": "free_t3",
        "LH": "lh",
        "% SATURATION": "iron_saturation_pct",
        # Thyroid / autoimmune
        "THYROID PEROXIDASE ANTIBODIES": "tpo_antibodies",
        "THYROGLOBULIN ANTIBODIES": "tg_antibodies",
        "RHEUMATOID FACTOR": "rheumatoid_factor",
        # Immunoglobulins
        "IMMUNOGLOBULIN A": "iga",
        # Minerals
        "ZINC": "zinc",
        # Heavy metals
        "LEAD (VENOUS)": "lead_venous",
        "MERCURY, BLOOD": "mercury_blood",
        # Urine
        "ALBUMIN, URINE": "albumin_urine",
        # PSA derived
        "PSA, % FREE": "psa_pct_free",
        # Lipoprotein(a)
        "LIPOPROTEIN (A)": "lpa",
        # OmegaCheck composite
        "EPA+DPA+DHA": "omegacheck",
        "OMEGA-3 (EPA+DHA) INDEX": "omega3_index",
        "OMEGA 6/OMEGA 3 RATIO": "omega6_omega3_ratio",
        "EPA/ARACHIDONIC ACID RATIO": "epa_aa_ratio",
        # Celiac / autoimmune
        "TISSUE TRANSGLUTAMINASE AB, IGA": "ttg_iga",
        # Thyroid free hormones (alternate names)
        "T3, FREE": "free_t3",
        # BUN/Creatinine
        "BUN/CREATININE RATIO": "bun_creatinine_ratio",
        # Urinalysis qualitative components
        "PH": "urine_ph",
        "COLOR": "urine_color",
        "APPEARANCE": "urine_appearance",
        "GLUCOSE (UA)": "urine_glucose",
        "BILIRUBIN (UA)": "urine_bilirubin",
        "KETONES": "urine_ketones",
        "OCCULT BLOOD": "urine_occult_blood",
        "PROTEIN (UA)": "urine_protein",
        "NITRITE": "urine_nitrite",
        "LEUKOCYTE ESTERASE": "urine_leukocyte_esterase",
        "WBC (UA)": "urine_wbc",
        "RBC (UA)": "urine_rbc",
        "SQUAMOUS EPITHELIAL CELLS": "urine_squamous_epithelial",
        "BACTERIA": "urine_bacteria",
        "HYALINE CAST": "urine_hyaline_cast",
        # Vitamin D alternate name
        "VITAMIN D,25-OH,TOTAL,IA": "vitamin_d",
    }
    # Direct match
    if test in mapping:
        return mapping[test]
    # Try uppercase
    upper = test.upper().strip()
    if upper in mapping:
        return mapping[upper]
    # Partial matches for common patterns
    for key, val in mapping.items():
        if key in upper:
            return val
    return None


def _parse_collection_date(date_str: str) -> str:
    """Parse collection date to ISO format (YYYY-MM-DD)."""
    # Format: "03/15/2025 03:16 PM" or "11/13/2024 01:59 PM"
    match = re.match(r"(\d{2})/(\d{2})/(\d{4})", date_str)
    if match:
        month, day, year = match.groups()
        return f"{year}-{month}-{day}"
    return date_str


def load_lab_results(path: Optional[Path] = None) -> pd.DataFrame:
    """
    Load lab results from structured JSON, pivot to wide format.

    Returns a DataFrame with one row per collection date and one column per test.
    Also computes derived markers like iron_saturation_pct.
    """
    path = path or LAB_RESULTS_PATH
    with open(path, "r") as f:
        records = json.load(f)

    rows = []
    for rec in records:
        test_key = _normalize_test_name(rec.get("test", ""))
        if test_key is None:
            continue

        value = _parse_value(rec.get("value", ""))
        if value is None:
            continue

        date = _parse_collection_date(rec.get("collection_date", ""))

        rows.append({
            "date": date,
            "test": test_key,
            "value": value,
            "flag": rec.get("flag", ""),
            "panel": rec.get("panel", ""),
            "file": rec.get("file", ""),
        })

    df_long = pd.DataFrame(rows)
    if df_long.empty:
        return pd.DataFrame()

    # Remove duplicates: keep first occurrence per date+test
    df_long = df_long.drop_duplicates(subset=["date", "test"], keep="first")

    # Pivot to wide: one row per collection date, one column per test
    df_wide = df_long.pivot(index="date", columns="test", values="value")
    df_wide = df_wide.sort_index()
    df_wide.index.name = "date"
    df_wide = df_wide.reset_index()

    # Derive computed markers
    if "iron_total" in df_wide.columns and "tibc" in df_wide.columns:
        mask = df_wide["iron_total"].notna() & df_wide["tibc"].notna()
        df_wide.loc[mask, "iron_saturation_pct_computed"] = (
            df_wide.loc[mask, "iron_total"] / df_wide.loc[mask, "tibc"] * 100
        ).round(1)

    if "epa" in df_wide.columns and "dha" in df_wide.columns:
        mask = df_wide["epa"].notna() & df_wide["dha"].notna()
        df_wide.loc[mask, "omega3_index_computed"] = (
            df_wide.loc[mask, "epa"] + df_wide.loc[mask, "dha"]
        ).round(1)

    return df_wide


def load_medix_data(path: Optional[Path] = None) -> dict:
    """Load Medix BRN structured assessment data."""
    path = path or MEDIX_DATA_PATH
    with open(path, "r") as f:
        return json.load(f)


def get_lab_flags(path: Optional[Path] = None) -> pd.DataFrame:
    """Return a DataFrame of flagged (H/L) lab values for clinical review."""
    path = path or LAB_RESULTS_PATH
    with open(path, "r") as f:
        records = json.load(f)

    flagged = []
    for rec in records:
        if rec.get("flag") in ("H", "L"):
            flagged.append({
                "date": _parse_collection_date(rec.get("collection_date", "")),
                "test": rec.get("test", ""),
                "value": rec.get("value", ""),
                "flag": rec.get("flag", ""),
                "reference_range": rec.get("reference_range", ""),
                "panel": rec.get("panel", ""),
            })

    return pd.DataFrame(flagged)
