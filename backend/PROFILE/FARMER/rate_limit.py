"""
Minimal in-memory rate limiter.

NOTE: This is process-local and resets on restart / doesn't work across
multiple server instances. It is enough to stop casual OTP-spam and
brute-force attempts in an MVP/demo. Before real deployment, swap the
in-memory dict for Redis (INCR + EXPIRE) so limits hold across replicas.
"""

import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException

_attempts: dict[str, list[float]] = defaultdict(list)
_lock = Lock()


def check_rate_limit(key: str, max_attempts: int, window_seconds: int) -> None:
    """
    Raises HTTPException(429) if `key` has exceeded max_attempts
    within the trailing window_seconds.
    """
    now = time.time()

    with _lock:
        attempts = _attempts[key]
        # drop anything outside the window
        attempts[:] = [t for t in attempts if now - t < window_seconds]

        if len(attempts) >= max_attempts:
            raise HTTPException(
                status_code=429,
                detail="Too many attempts. Please try again later.",
            )

        attempts.append(now)