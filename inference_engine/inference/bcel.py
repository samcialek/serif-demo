"""
Bayesian Changepoint Estimation with Literature priors (BCEL).

Fits piecewise-linear models with threshold detection using either:
- Full PyMC MCMC (when available)
- Scipy-based approximate Bayesian inference (fallback)

Each model estimates: theta (changepoint), beta_below, beta_above, alpha, sigma
"""
import numpy as np
from typing import Dict, Tuple, Optional
from scipy.optimize import minimize
from scipy.stats import norm

from inference_engine.inference.population_priors import PriorSpec, get_prior
from inference_engine.config import MCMC_SAMPLES, MCMC_CHAINS, MCMC_TUNE, THOMPSON_WORLDS


def _piecewise_linear(x: np.ndarray, theta: float, alpha: float,
                       beta_below: float, beta_above: float,
                       Z: Optional[np.ndarray] = None,
                       gamma: Optional[np.ndarray] = None) -> np.ndarray:
    """
    Piecewise linear function with changepoint at theta.
    Optionally includes covariate adjustment: + gamma' * Z.
    """
    y = np.where(
        x <= theta,
        alpha + beta_below * (x - theta),
        alpha + beta_above * (x - theta),
    )
    if Z is not None and gamma is not None and len(gamma) > 0:
        y = y + Z @ gamma
    return y


def _log_posterior(params: np.ndarray, x: np.ndarray, y: np.ndarray,
                    prior: PriorSpec, Z: Optional[np.ndarray] = None,
                    n_covariates: int = 0,
                    likelihood_weight: float = 1.0,
                    sigma_prior_log_mu: Optional[float] = None,
                    sigma_prior_log_sigma: Optional[float] = None,
                    sigma_prior_blend: Optional[float] = None) -> float:
    """
    Negative log-posterior for piecewise linear model with priors.
    Supports optional covariates Z with coefficients gamma.

    likelihood_weight: Scale factor for the data likelihood (0-1).
        Used to correct for autocorrelation in interpolated lab data.
        E.g., if 452 daily points come from 4 real lab draws,
        likelihood_weight = 4/452 ~ 0.009, preventing interpolated
        data from overwhelming the prior.

    sigma_prior_log_mu: If provided, center of log-normal prior on sigma.
    sigma_prior_log_sigma: Width of log-normal prior on sigma.
    sigma_prior_blend: Blend weight (0-1) between informative prior and Jeffrey's.
        blend=1 is fully informative, blend=0 is pure Jeffrey's.
    """
    # Unpack: first 5 are core params, rest are gamma coefficients
    theta, alpha, beta_below, beta_above, log_sigma = params[:5]
    gamma = params[5:] if n_covariates > 0 else None
    sigma = np.exp(log_sigma)

    # Likelihood (tempered by likelihood_weight for autocorrelated data)
    y_pred = _piecewise_linear(x, theta, alpha, beta_below, beta_above, Z, gamma)
    ll = likelihood_weight * np.sum(norm.logpdf(y, loc=y_pred, scale=sigma))

    # Priors on core parameters
    lp_theta = norm.logpdf(theta, prior.theta_mu, prior.theta_sigma)
    lp_bb = norm.logpdf(beta_below, prior.beta_below_mu, prior.beta_below_sigma)
    lp_ba = norm.logpdf(beta_above, prior.beta_above_mu, prior.beta_above_sigma)
    lp_alpha = norm.logpdf(alpha, np.mean(y), np.std(y) + 1e-6)

    # Sigma prior: blend informative log-normal with Jeffrey's
    if (sigma_prior_log_mu is not None and sigma_prior_log_sigma is not None
            and sigma_prior_blend is not None and sigma_prior_blend > 0):
        lp_informative = norm.logpdf(log_sigma, sigma_prior_log_mu, sigma_prior_log_sigma)
        lp_jeffreys = -log_sigma
        lp_sigma = sigma_prior_blend * lp_informative + (1 - sigma_prior_blend) * lp_jeffreys
    else:
        lp_sigma = -log_sigma  # Jeffrey's prior on sigma (HalfCauchy approx)

    # Weakly informative priors on gamma (N(0, 5) — absorb confounding, don't dominate)
    lp_gamma = 0.0
    if gamma is not None:
        lp_gamma = np.sum(norm.logpdf(gamma, 0, 5.0))

    return -(ll + lp_theta + lp_bb + lp_ba + lp_alpha + lp_sigma + lp_gamma)


def fit_bcel_approximate(
    x: np.ndarray,
    y: np.ndarray,
    prior: PriorSpec,
    Z: Optional[np.ndarray] = None,
    n_restarts: int = 10,
    likelihood_weight: float = 1.0,
    sigma_prior_log_mu: Optional[float] = None,
    sigma_prior_log_sigma: Optional[float] = None,
    sigma_prior_blend: Optional[float] = None,
) -> Dict:
    """
    Approximate Bayesian inference via Laplace approximation.
    Finds MAP estimate, then approximates posterior as Gaussian around MAP.
    Uses multiple random restarts for robustness.

    Args:
        x: Dose values (1D array, n observations)
        y: Response values (1D array, n observations)
        prior: Population prior specification
        Z: Optional covariate matrix (n x k) for backdoor adjustment.
           Columns are standardized environment/load variables.
        n_restarts: Number of random restarts for optimization
        likelihood_weight: Scale factor for data likelihood (effectiveN / rawN).
            Prevents interpolated data from overwhelming the prior.
        sigma_prior_log_mu: Center of informative log-normal prior on sigma.
        sigma_prior_log_sigma: Width of informative log-normal prior on sigma.
        sigma_prior_blend: Blend weight (0-1) between informative and Jeffrey's.
    """
    n_cov = Z.shape[1] if Z is not None else 0
    best_result = None
    best_loss = np.inf

    for _ in range(n_restarts):
        # Random initialization around prior means
        theta0 = prior.theta_mu + np.random.randn() * prior.theta_sigma * 0.5
        alpha0 = np.mean(y) + np.random.randn() * np.std(y) * 0.2
        bb0 = prior.beta_below_mu + np.random.randn() * prior.beta_below_sigma * 0.3
        ba0 = prior.beta_above_mu + np.random.randn() * prior.beta_above_sigma * 0.3
        ls0 = np.log(max(np.std(y) * 0.5, 0.01))

        x0 = np.array([theta0, alpha0, bb0, ba0, ls0])
        # Append gamma init (near zero — covariates start neutral)
        if n_cov > 0:
            gamma0 = np.random.randn(n_cov) * 0.1
            x0 = np.concatenate([x0, gamma0])

        try:
            # Bounds: theta within ±3 sigma of prior; others unbounded
            theta_lo = prior.theta_mu - 4 * prior.theta_sigma
            theta_hi = prior.theta_mu + 4 * prior.theta_sigma
            # Also bound theta to data range with some margin
            data_lo = float(np.min(x)) - 0.1 * (np.max(x) - np.min(x) + 1e-6)
            data_hi = float(np.max(x)) + 0.1 * (np.max(x) - np.min(x) + 1e-6)
            theta_lo = max(theta_lo, data_lo)
            theta_hi = min(theta_hi, data_hi)
            bounds = [(theta_lo, theta_hi)]  # theta
            bounds += [(None, None)] * 3  # alpha, beta_below, beta_above
            bounds += [(None, None)]  # log_sigma
            if n_cov > 0:
                bounds += [(None, None)] * n_cov  # gamma

            result = minimize(
                _log_posterior, x0,
                args=(x, y, prior, Z, n_cov, likelihood_weight,
                      sigma_prior_log_mu, sigma_prior_log_sigma, sigma_prior_blend),
                method="L-BFGS-B",
                bounds=bounds,
                options={"maxiter": 2000},
            )
            if result.fun < best_loss:
                best_loss = result.fun
                best_result = result
        except (ValueError, RuntimeError):
            continue

    if best_result is None:
        # Fallback to pure prior
        return _prior_only_posterior(prior, y)

    # Extract MAP estimates
    theta_map, alpha_map, bb_map, ba_map, ls_map = best_result.x[:5]
    gamma_map = best_result.x[5:] if n_cov > 0 else np.array([])
    sigma_map = np.exp(ls_map)

    # Approximate posterior covariance via inverse Hessian
    n_params = len(best_result.x)
    try:
        # Scale-adaptive epsilon: proportional to parameter magnitude
        eps_vec = np.maximum(np.abs(best_result.x) * 1e-4, 1e-6)

        H = np.zeros((n_params, n_params))
        for i in range(n_params):
            for j in range(n_params):
                ei, ej = eps_vec[i], eps_vec[j]
                x_pp = best_result.x.copy(); x_pp[i] += ei; x_pp[j] += ej
                x_pm = best_result.x.copy(); x_pm[i] += ei; x_pm[j] -= ej
                x_mp = best_result.x.copy(); x_mp[i] -= ei; x_mp[j] += ej
                x_mm = best_result.x.copy(); x_mm[i] -= ei; x_mm[j] -= ej
                _lp_args = (x, y, prior, Z, n_cov, likelihood_weight,
                            sigma_prior_log_mu, sigma_prior_log_sigma, sigma_prior_blend)
                H[i, j] = (
                    _log_posterior(x_pp, *_lp_args) -
                    _log_posterior(x_pm, *_lp_args) -
                    _log_posterior(x_mp, *_lp_args) +
                    _log_posterior(x_mm, *_lp_args)
                ) / (4 * ei * ej)

        # Stronger regularization: 1e-3 * diagonal for numerical stability
        reg = 1e-3 * np.diag(np.maximum(np.abs(np.diag(H)), 1e-4))
        cov = np.linalg.inv(H + reg)
        # Ensure positive diagonal; clamp to prior std if degenerate
        diag = np.diag(cov)
        fallback_stds = np.array([prior.theta_sigma, np.std(y) + 1e-6,
                                   prior.beta_below_sigma, prior.beta_above_sigma, 0.5]
                                  + ([1.0] * n_cov if n_cov > 0 else []))
        # Use np.maximum to avoid sqrt of negative values before the where check
        safe_diag = np.maximum(diag, 0.0)
        stds = np.where(diag > 0, np.sqrt(safe_diag), fallback_stds[:n_params])
    except (np.linalg.LinAlgError, ValueError):
        # Fallback: use prior standard deviations
        fallback = [prior.theta_sigma, np.std(y), prior.beta_below_sigma,
                    prior.beta_above_sigma, 0.5]
        if n_cov > 0:
            fallback.extend([1.0] * n_cov)
        stds = np.array(fallback)

    result_dict = {
        "theta_mean": float(theta_map),
        "theta_std": float(stds[0]),
        "alpha_mean": float(alpha_map),
        "alpha_std": float(stds[1]),
        "beta_below_mean": float(bb_map),
        "beta_below_std": float(stds[2]),
        "beta_above_mean": float(ba_map),
        "beta_above_std": float(stds[3]),
        "sigma_mean": float(sigma_map),
        "n_obs": len(x),
        "converged": best_result.success,
    }

    # Include covariate coefficients for transparency
    if n_cov > 0:
        result_dict["gamma_map"] = gamma_map.tolist()
        result_dict["gamma_std"] = stds[5:].tolist()
        result_dict["n_covariates"] = n_cov

    return result_dict


def fit_bcel_grid_conditional(
    x: np.ndarray,
    y: np.ndarray,
    prior: PriorSpec,
    Z: Optional[np.ndarray] = None,
    likelihood_weight: float = 1.0,
    n_grid: int = 200,
    n_samples: int = 1000,
    sigma_prior_log_mu: Optional[float] = None,
    sigma_prior_log_sigma: Optional[float] = None,
    sigma_prior_blend: Optional[float] = None,
) -> Dict:
    """
    Grid-conditional Laplace: exact marginal over theta, Laplace for rest.

    This method handles the piecewise-linear kink at theta correctly by:
    1. Evaluating theta's marginal posterior on a dense grid
    2. For each theta, analytically solving for (alpha, betas) via OLS
    3. Computing the conditional log-posterior for each grid point
    4. Sampling theta from its marginal, then drawing betas conditionally

    Runs in pure numpy/scipy (no compiler needed), ~1-3 seconds per edge.
    Captures multi-modality in theta that single-point Laplace misses.

    sigma_prior_log_mu/log_sigma/blend: When provided, uses an informative
    log-normal prior on sigma blended with Jeffrey's. For each theta grid
    point, sigma is optimized via a 1D MAP search over a sigma grid instead
    of the OLS residual estimate.
    """
    n_cov = Z.shape[1] if Z is not None else 0
    n = len(x)

    # Build theta grid: cover ±3 sigma from prior, clipped to data range
    x_min, x_max = float(np.min(x)), float(np.max(x))
    x_range = x_max - x_min + 1e-6
    grid_lo = max(prior.theta_mu - 3 * prior.theta_sigma, x_min - 0.05 * x_range)
    grid_hi = min(prior.theta_mu + 3 * prior.theta_sigma, x_max + 0.05 * x_range)
    theta_grid = np.linspace(grid_lo, grid_hi, n_grid)

    # For each theta, solve for optimal (alpha, beta_below, beta_above, gamma)
    # via weighted least squares — this is analytic and fast.
    log_marginal = np.full(n_grid, -np.inf)
    conditional_params = []  # Store (alpha, bb, ba, gamma, sigma, residual_ss) per theta

    for i, th in enumerate(theta_grid):
        # Build design matrix for given theta
        x_below = np.where(x <= th, x - th, 0.0)
        x_above = np.where(x > th, x - th, 0.0)
        cols = [np.ones(n), x_below, x_above]
        if Z is not None:
            for k in range(n_cov):
                cols.append(Z[:, k])
        A = np.column_stack(cols)

        # Solve OLS: A @ beta_hat = y
        try:
            beta_hat, residuals, rank, sv = np.linalg.lstsq(A, y, rcond=None)
        except np.linalg.LinAlgError:
            conditional_params.append(None)
            continue

        alpha_hat = beta_hat[0]
        bb_hat = beta_hat[1]
        ba_hat = beta_hat[2]
        gamma_hat = beta_hat[3:] if n_cov > 0 else np.array([])

        y_pred = A @ beta_hat
        ss_res = np.sum((y - y_pred) ** 2)

        # Determine sigma: either OLS estimate or 1D MAP with informative prior
        has_sigma_prior = (sigma_prior_log_mu is not None
                           and sigma_prior_log_sigma is not None
                           and sigma_prior_blend is not None
                           and sigma_prior_blend > 0)

        if has_sigma_prior:
            # 1D MAP search over sigma grid incorporating the prior.
            # OLS sigma is a good starting point; search around it.
            sigma_ols = np.sqrt(ss_res / max(n - len(beta_hat), 1))
            sigma_ols = max(sigma_ols, 1e-10)
            sigma_expected = np.exp(sigma_prior_log_mu)
            # Grid spans from 0.1x to 5x of the larger of OLS or expected
            sigma_ref = max(sigma_ols, sigma_expected)
            sigma_grid = np.exp(np.linspace(
                np.log(max(sigma_ref * 0.1, 1e-10)),
                np.log(sigma_ref * 5.0),
                50
            ))
            best_sigma_lp = -np.inf
            sigma_hat = sigma_ols  # fallback
            for sg in sigma_grid:
                log_sg = np.log(sg)
                # Log-likelihood at this sigma
                sg_ll = likelihood_weight * (
                    -0.5 * n * np.log(2 * np.pi) - n * log_sg - 0.5 * ss_res / sg**2
                )
                # Blended sigma prior
                sg_lp_info = norm.logpdf(log_sg, sigma_prior_log_mu, sigma_prior_log_sigma)
                sg_lp_jeff = -log_sg
                sg_lp_prior = (sigma_prior_blend * sg_lp_info
                               + (1 - sigma_prior_blend) * sg_lp_jeff)
                sg_total = sg_ll + sg_lp_prior
                if sg_total > best_sigma_lp:
                    best_sigma_lp = sg_total
                    sigma_hat = sg
        else:
            sigma_hat = np.sqrt(ss_res / max(n - len(beta_hat), 1))

        # Compute log-posterior at this (theta, optimal params)
        # Log-likelihood (tempered)
        if sigma_hat < 1e-10:
            sigma_hat = 1e-10
        ll = likelihood_weight * (-0.5 * n * np.log(2 * np.pi) - n * np.log(sigma_hat)
                                   - 0.5 * ss_res / sigma_hat**2)

        # Log-prior contributions
        lp_theta = norm.logpdf(th, prior.theta_mu, prior.theta_sigma)
        lp_bb = norm.logpdf(bb_hat, prior.beta_below_mu, prior.beta_below_sigma)
        lp_ba = norm.logpdf(ba_hat, prior.beta_above_mu, prior.beta_above_sigma)
        lp_alpha = norm.logpdf(alpha_hat, np.mean(y), np.std(y) + 1e-6)

        # Sigma prior contribution to log-marginal
        if has_sigma_prior:
            log_sh = np.log(sigma_hat)
            lp_sigma_info = norm.logpdf(log_sh, sigma_prior_log_mu, sigma_prior_log_sigma)
            lp_sigma_jeff = -log_sh
            lp_sigma = (sigma_prior_blend * lp_sigma_info
                        + (1 - sigma_prior_blend) * lp_sigma_jeff)
        else:
            lp_sigma = 0.0  # Jeffrey's already implicit in OLS sigma

        lp_gamma = 0.0
        if n_cov > 0:
            lp_gamma = np.sum(norm.logpdf(gamma_hat, 0, 5.0))

        log_marginal[i] = ll + lp_theta + lp_bb + lp_ba + lp_alpha + lp_sigma + lp_gamma

        # Compute conditional covariance via (A^T A)^{-1} * sigma^2
        try:
            cov = np.linalg.inv(A.T @ A) * sigma_hat**2
        except np.linalg.LinAlgError:
            cov = np.eye(len(beta_hat)) * sigma_hat**2

        conditional_params.append({
            "alpha": alpha_hat, "bb": bb_hat, "ba": ba_hat,
            "gamma": gamma_hat, "sigma": sigma_hat,
            "beta_hat": beta_hat, "cov": cov,
        })

    # Normalize marginal to get proper probabilities
    valid = np.isfinite(log_marginal)
    if not np.any(valid):
        return None  # Fallback to standard Laplace

    log_marginal[~valid] = -np.inf
    log_marginal -= np.max(log_marginal)  # Shift for numerical stability
    marginal_probs = np.exp(log_marginal)
    marginal_probs /= marginal_probs.sum()

    # Sample theta from marginal, then draw (alpha, betas) conditionally
    theta_indices = np.random.choice(n_grid, size=n_samples, p=marginal_probs)

    theta_samples = []
    alpha_samples = []
    bb_samples = []
    ba_samples = []

    for idx in theta_indices:
        th = theta_grid[idx]
        cp = conditional_params[idx]
        if cp is None:
            # Shouldn't happen given valid filtering, but fallback
            theta_samples.append(th)
            alpha_samples.append(np.mean(y))
            bb_samples.append(prior.beta_below_mu)
            ba_samples.append(prior.beta_above_mu)
            continue

        # Draw from conditional: N(beta_hat, cov)
        try:
            sample = np.random.multivariate_normal(cp["beta_hat"], cp["cov"])
        except np.linalg.LinAlgError:
            sample = cp["beta_hat"]

        theta_samples.append(th)
        alpha_samples.append(sample[0])
        bb_samples.append(sample[1])
        ba_samples.append(sample[2])

    # Compute summary statistics
    theta_arr = np.array(theta_samples)
    alpha_arr = np.array(alpha_samples)
    bb_arr = np.array(bb_samples)
    ba_arr = np.array(ba_samples)

    # Find MAP (mode of grid)
    map_idx = np.argmax(marginal_probs)
    map_cp = conditional_params[map_idx]

    return {
        "theta_mean": float(theta_arr.mean()),
        "theta_std": float(theta_arr.std()),
        "alpha_mean": float(alpha_arr.mean()),
        "alpha_std": float(alpha_arr.std()),
        "beta_below_mean": float(bb_arr.mean()),
        "beta_below_std": float(bb_arr.std()),
        "beta_above_mean": float(ba_arr.mean()),
        "beta_above_std": float(ba_arr.std()),
        "sigma_mean": float(map_cp["sigma"]) if map_cp else 1.0,
        "n_obs": len(x),
        "converged": True,
        "method": "grid_conditional_laplace",
        # Raw posterior samples for Thompson sampling
        "theta_samples": theta_arr.tolist(),
        "alpha_samples": alpha_arr.tolist(),
        "beta_below_samples": bb_arr.tolist(),
        "beta_above_samples": ba_arr.tolist(),
    }


def _prior_only_posterior(prior: PriorSpec, y: np.ndarray) -> Dict:
    """When fitting fails, return prior as posterior (no personal data signal)."""
    return {
        "theta_mean": prior.theta_mu,
        "theta_std": prior.theta_sigma,
        "alpha_mean": float(np.mean(y)) if len(y) > 0 else 0,
        "alpha_std": float(np.std(y)) if len(y) > 0 else 1,
        "beta_below_mean": prior.beta_below_mu,
        "beta_below_std": prior.beta_below_sigma,
        "beta_above_mean": prior.beta_above_mu,
        "beta_above_std": prior.beta_above_sigma,
        "sigma_mean": float(np.std(y)) if len(y) > 0 else 1,
        "n_obs": len(y),
        "converged": False,
    }


def fit_bcel_pymc(
    x: np.ndarray,
    y: np.ndarray,
    prior: PriorSpec,
    Z: Optional[np.ndarray] = None,
    likelihood_weight: float = 1.0,
    sigma_prior_log_mu: Optional[float] = None,
    sigma_prior_log_sigma: Optional[float] = None,
    sigma_prior_blend: Optional[float] = None,
) -> Optional[Dict]:
    """
    Full PyMC MCMC inference (optional — requires pymc installed).
    Falls back to approximate if PyMC not available.

    Args:
        x: Dose values (1D array)
        y: Response values (1D array)
        prior: Population prior specification
        Z: Optional covariate matrix (n x k) for backdoor adjustment
        likelihood_weight: Scale factor for data likelihood (effectiveN / rawN)
        sigma_prior_log_mu: Center of informative log-normal prior on sigma.
        sigma_prior_log_sigma: Width of informative log-normal prior on sigma.
        sigma_prior_blend: Blend weight (0-1) between informative and Jeffrey's.
    """
    try:
        import pymc as pm
        import arviz as az
        import pytensor.tensor as pt
    except ImportError:
        return None

    n_cov = Z.shape[1] if Z is not None else 0

    # Subsample large datasets for MCMC speed (pure Python backend is slow).
    # With correlated daily data, 500 uniformly-spaced points capture the
    # same posterior shape — we already account for autocorrelation via
    # likelihood_weight, so subsampling is statistically sound.
    MAX_MCMC_OBS = 500
    n_orig = len(x)
    if n_orig > MAX_MCMC_OBS:
        idx = np.linspace(0, n_orig - 1, MAX_MCMC_OBS, dtype=int)
        x = x[idx]
        y = y[idx]
        if Z is not None:
            Z = Z[idx]
        # Scale likelihood weight to account for subsampling
        likelihood_weight = likelihood_weight * (n_orig / MAX_MCMC_OBS)

    with pm.Model() as model:
        # Priors — same as Laplace path for consistency
        theta = pm.Normal("theta", mu=prior.theta_mu, sigma=prior.theta_sigma)
        alpha = pm.Normal("alpha", mu=np.mean(y), sigma=np.std(y) + 0.1)
        beta_below = pm.Normal("beta_below", mu=prior.beta_below_mu, sigma=prior.beta_below_sigma)
        beta_above = pm.Normal("beta_above", mu=prior.beta_above_mu, sigma=prior.beta_above_sigma)

        # Sigma prior: informative LogNormal when CV is known, else HalfCauchy
        if (sigma_prior_log_mu is not None and sigma_prior_log_sigma is not None
                and sigma_prior_blend is not None and sigma_prior_blend > 0.5):
            # Strong informative prior — use LogNormal directly
            sigma = pm.LogNormal("sigma", mu=sigma_prior_log_mu,
                                 sigma=sigma_prior_log_sigma)
        else:
            sigma = pm.HalfCauchy("sigma", beta=1)

        # Optional covariate coefficients
        if n_cov > 0:
            gamma = pm.Normal("gamma", mu=0, sigma=5.0, shape=n_cov)

        # Piecewise linear model
        mu = pm.math.switch(
            x <= theta,
            alpha + beta_below * (x - theta),
            alpha + beta_above * (x - theta),
        )

        # Add covariate effect
        if n_cov > 0:
            mu = mu + pt.dot(Z, gamma)

        # Likelihood — tempered for autocorrelated data
        if likelihood_weight < 1.0:
            # Use a Potential to scale the log-likelihood
            residuals = y - mu
            scaled_ll = likelihood_weight * pm.math.sum(
                -0.5 * pt.log(2 * np.pi) - pt.log(sigma) - 0.5 * (residuals / sigma) ** 2
            )
            pm.Potential("tempered_likelihood", scaled_ll)
        else:
            pm.Normal("obs", mu=mu, sigma=sigma, observed=y)

        # Sample
        trace = pm.sample(
            draws=MCMC_SAMPLES,
            tune=MCMC_TUNE,
            chains=MCMC_CHAINS,
            cores=1,  # Safe for all platforms
            return_inferencedata=True,
            progressbar=True,
        )

    # Extract posterior summaries
    var_names = ["theta", "alpha", "beta_below", "beta_above", "sigma"]
    if n_cov > 0:
        var_names.append("gamma")
    summary = az.summary(trace, var_names=var_names)

    # Check convergence
    rhat_ok = all(summary["r_hat"] < 1.05)
    ess_ok = all(summary["ess_bulk"] > 100)

    # Extract full posterior samples for Thompson sampling
    post = trace.posterior
    result = {
        "theta_mean": float(post["theta"].mean()),
        "theta_std": float(post["theta"].std()),
        "alpha_mean": float(post["alpha"].mean()),
        "alpha_std": float(post["alpha"].std()),
        "beta_below_mean": float(post["beta_below"].mean()),
        "beta_below_std": float(post["beta_below"].std()),
        "beta_above_mean": float(post["beta_above"].mean()),
        "beta_above_std": float(post["beta_above"].std()),
        "sigma_mean": float(post["sigma"].mean()),
        "n_obs": n_orig,
        "converged": rhat_ok and ess_ok,
        "rhat_max": float(summary["r_hat"].max()),
        "ess_min": float(summary["ess_bulk"].min()),
        "method": "pymc_mcmc",
        # Raw samples for Thompson sampling
        "theta_samples": post["theta"].values.flatten().tolist(),
        "alpha_samples": post["alpha"].values.flatten().tolist(),
        "beta_below_samples": post["beta_below"].values.flatten().tolist(),
        "beta_above_samples": post["beta_above"].values.flatten().tolist(),
    }

    # Include covariate coefficients
    if n_cov > 0:
        gamma_post = post["gamma"].values.reshape(-1, n_cov)
        result["gamma_map"] = gamma_post.mean(axis=0).tolist()
        result["gamma_std"] = gamma_post.std(axis=0).tolist()
        result["n_covariates"] = n_cov

    return result


def fit_edge(
    x: np.ndarray,
    y: np.ndarray,
    edge_key: str,
    Z: Optional[np.ndarray] = None,
    use_pymc: bool = False,
    prior_override: Optional[PriorSpec] = None,
    likelihood_weight: float = 1.0,
    sigma_prior_log_mu: Optional[float] = None,
    sigma_prior_log_sigma: Optional[float] = None,
    sigma_prior_blend: Optional[float] = None,
) -> Dict:
    """
    Fit BCEL model for a causal edge.

    Args:
        x: Dose values (1D array)
        y: Response values (1D array)
        edge_key: Key for looking up population prior
        Z: Optional covariate matrix (n x k) for backdoor adjustment.
           Pass standardized adjustment set variables here.
        use_pymc: If True, try PyMC MCMC first
        prior_override: If provided, use this prior instead of looking up by edge_key.
                        Used when dose window scaling is needed.
        likelihood_weight: Scale factor for data likelihood (effectiveN / rawN).
            Prevents interpolated/autocorrelated data from overwhelming the prior.
        sigma_prior_log_mu: Center of informative log-normal prior on sigma.
        sigma_prior_log_sigma: Width of informative log-normal prior on sigma.
        sigma_prior_blend: Blend weight (0-1) between informative and Jeffrey's.

    Tries grid-conditional Laplace for data-rich edges (use_pymc=True),
    falls back to standard Laplace for prior-dominated edges.
    """
    prior = prior_override if prior_override is not None else get_prior(edge_key)
    if prior is None:
        raise ValueError(f"No prior found for edge: {edge_key}")

    sigma_kw = dict(
        sigma_prior_log_mu=sigma_prior_log_mu,
        sigma_prior_log_sigma=sigma_prior_log_sigma,
        sigma_prior_blend=sigma_prior_blend,
    )

    result = None
    if use_pymc:
        # Use grid-conditional Laplace: handles theta kink correctly,
        # runs in seconds (no C compiler needed), produces real posterior samples.
        result = fit_bcel_grid_conditional(x, y, prior, Z=Z,
                                           likelihood_weight=likelihood_weight, **sigma_kw)

    if result is None:
        result = fit_bcel_approximate(x, y, prior, Z=Z,
                                       likelihood_weight=likelihood_weight, **sigma_kw)

    result["edge_key"] = edge_key
    result["prior"] = {
        "theta_mu": prior.theta_mu,
        "theta_sigma": prior.theta_sigma,
        "beta_below_mu": prior.beta_below_mu,
        "beta_below_sigma": prior.beta_below_sigma,
        "beta_above_mu": prior.beta_above_mu,
        "beta_above_sigma": prior.beta_above_sigma,
        "curve_type": prior.curve_type,
        "source": prior.source,
    }

    return result
