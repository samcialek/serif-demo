"""
Marker smoother using Gaussian Process regression.
For 6 sparse lab draws over ~2 years, provides daily interpolated estimates
with honest uncertainty bands.
"""
import numpy as np
import pandas as pd
from scipy.optimize import minimize
from typing import Dict, Tuple, Optional


def _rbf_kernel(x1: np.ndarray, x2: np.ndarray, length_scale: float, variance: float) -> np.ndarray:
    """Radial Basis Function (squared exponential) kernel."""
    sqdist = np.subtract.outer(x1, x2) ** 2
    return variance * np.exp(-0.5 * sqdist / length_scale ** 2)


def _gp_predict(
    x_train: np.ndarray,
    y_train: np.ndarray,
    x_pred: np.ndarray,
    length_scale: float,
    signal_var: float,
    noise_var: float,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Gaussian Process prediction with RBF kernel.

    Returns (mean, std) at prediction points.
    """
    K = _rbf_kernel(x_train, x_train, length_scale, signal_var) + noise_var * np.eye(len(x_train))
    K_star = _rbf_kernel(x_train, x_pred, length_scale, signal_var)
    K_ss = _rbf_kernel(x_pred, x_pred, length_scale, signal_var)

    # Cholesky solve for numerical stability
    try:
        L = np.linalg.cholesky(K + 1e-8 * np.eye(len(K)))
        alpha = np.linalg.solve(L.T, np.linalg.solve(L, y_train))
        v = np.linalg.solve(L, K_star)

        mean = K_star.T @ alpha
        cov = K_ss - v.T @ v
        std = np.sqrt(np.maximum(np.diag(cov), 1e-10))
    except np.linalg.LinAlgError:
        # Fallback: simple interpolation
        mean = np.interp(x_pred, x_train, y_train)
        std = np.full_like(x_pred, np.std(y_train))

    return mean, std


def _optimize_hyperparams(x: np.ndarray, y: np.ndarray) -> Tuple[float, float, float]:
    """Optimize GP hyperparameters via marginal likelihood."""
    def neg_log_marginal(params):
        ls, sv, nv = np.exp(params)
        K = _rbf_kernel(x, x, ls, sv) + nv * np.eye(len(x))
        try:
            L = np.linalg.cholesky(K + 1e-8 * np.eye(len(K)))
            alpha = np.linalg.solve(L.T, np.linalg.solve(L, y))
            log_ml = -0.5 * y @ alpha - np.sum(np.log(np.diag(L))) - 0.5 * len(x) * np.log(2 * np.pi)
            return -log_ml
        except np.linalg.LinAlgError:
            return 1e10

    # Initial guess: length_scale=180 days, signal_var=var(y), noise_var=0.1*var(y)
    y_var = max(np.var(y), 1e-4)
    x0 = np.log([180.0, y_var, 0.1 * y_var])

    result = minimize(neg_log_marginal, x0, method="L-BFGS-B",
                      bounds=[(-2, 8), (-5, 10), (-10, 5)])

    ls, sv, nv = np.exp(result.x)
    return ls, sv, nv


def smooth_marker(
    dates: list,
    values: list,
    pred_start: Optional[str] = None,
    pred_end: Optional[str] = None,
    freq: str = "D",
) -> pd.DataFrame:
    """
    Smooth a single lab marker using GP regression.

    Args:
        dates: List of collection dates (ISO strings)
        values: Corresponding marker values
        pred_start: Start date for predictions (defaults to first observation)
        pred_end: End date for predictions (defaults to last observation)
        freq: Prediction frequency ('D' for daily)

    Returns:
        DataFrame with columns: [date, mean, std, low_95, high_95]
    """
    dates_dt = pd.to_datetime(dates)
    values = np.array(values, dtype=float)

    # Remove NaN
    mask = ~np.isnan(values)
    dates_dt = dates_dt[mask]
    values = values[mask]

    if len(values) < 2:
        return pd.DataFrame(columns=["date", "mean", "std", "low_95", "high_95"])

    # Convert dates to numeric (days from start)
    origin = dates_dt.min()
    x_train = (dates_dt - origin).total_seconds().values / 86400.0  # days

    # Prediction range
    start = pd.to_datetime(pred_start) if pred_start else dates_dt.min()
    end = pd.to_datetime(pred_end) if pred_end else dates_dt.max()
    pred_dates = pd.date_range(start, end, freq=freq)
    x_pred = (pred_dates - origin).total_seconds().values / 86400.0

    # Optimize hyperparameters
    length_scale, signal_var, noise_var = _optimize_hyperparams(x_train, values)

    # Predict
    mean, std = _gp_predict(x_train, values, x_pred, length_scale, signal_var, noise_var)

    return pd.DataFrame({
        "date": pred_dates,
        "mean": mean,
        "std": std,
        "low_95": mean - 1.96 * std,
        "high_95": mean + 1.96 * std,
    })


def smooth_all_markers(labs_wide: pd.DataFrame, markers: Optional[list] = None) -> Dict[str, pd.DataFrame]:
    """
    Apply GP smoothing to all specified markers in the wide-format lab DataFrame.

    Args:
        labs_wide: Wide-format lab results (one row per date, columns = tests)
        markers: List of marker column names to smooth (defaults to key markers)

    Returns:
        Dict mapping marker name → smoothed DataFrame
    """
    if markers is None:
        markers = [
            # Iron / hematology
            "iron_total", "ferritin", "iron_saturation_pct", "iron_saturation_pct_computed",
            "hemoglobin", "hematocrit",
            # CBC
            "wbc", "rbc", "mcv", "mch", "mchc", "rdw", "platelets", "mpv",
            "neutrophils_abs", "lymphocytes_abs", "monocytes_abs",
            "eosinophils_abs", "basophils_abs",
            # Hormones
            "testosterone", "free_testosterone", "shbg", "dhea_s",
            "cortisol", "estradiol", "fsh", "prolactin", "lh",
            # Thyroid
            "free_t3", "free_t4",
            # Lipids
            "total_cholesterol", "hdl", "ldl", "triglycerides",
            "non_hdl_cholesterol", "apob", "ldl_particle_number",
            "ldl_small", "ldl_peak_size", "hdl_large",
            # Inflammation
            "hscrp",
            # Metabolic
            "glucose", "hba1c", "insulin", "uric_acid", "homocysteine",
            # Vitamins / minerals
            "vitamin_d", "b12", "folate", "zinc", "magnesium_rbc",
            # Omega-3 panel
            "epa", "dha", "arachidonic_acid", "omega3_index",
            # Kidney / liver
            "bun", "creatinine", "egfr", "ast", "alt", "ggt",
            "albumin", "bilirubin_total",
            # Other
            "leptin", "methylmalonic_acid", "tsh",
        ]

    results = {}
    dates = labs_wide["date"].tolist()

    for marker in markers:
        if marker not in labs_wide.columns:
            continue

        values = labs_wide[marker].tolist()
        valid_count = sum(1 for v in values if pd.notna(v))
        if valid_count < 2:
            continue

        smoothed = smooth_marker(dates, values)
        if not smoothed.empty:
            results[marker] = smoothed

    return results
