"""
Metrics collection and Prometheus integration
"""
from typing import Dict, Any
from fastapi import FastAPI

# Metrics storage (in production, use Prometheus client)
_metrics: Dict[str, Any] = {
    "requests_total": 0,
    "generation_requests": 0,
    "tokens_generated": 0,
    "errors_total": 0,
    "model_load_time": None,
    "average_generation_time": 0.0
}


def setup_metrics(app: FastAPI) -> None:
    """
    Setup metrics collection for FastAPI app
    
    Args:
        app: FastAPI application instance
    """
    # In production, integrate with Prometheus client here
    pass


def increment_counter(metric_name: str, value: int = 1) -> None:
    """
    Increment a counter metric
    
    Args:
        metric_name: Name of the metric
        value: Value to increment by
    """
    if metric_name in _metrics:
        _metrics[metric_name] += value
    else:
        _metrics[metric_name] = value


def set_gauge(metric_name: str, value: float) -> None:
    """
    Set a gauge metric
    
    Args:
        metric_name: Name of the metric
        value: Value to set
    """
    _metrics[metric_name] = value


def get_metrics() -> Dict[str, Any]:
    """
    Get all metrics
    
    Returns:
        Dictionary of metrics
    """
    return _metrics.copy()

