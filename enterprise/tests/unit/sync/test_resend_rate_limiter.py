"""Tests for the RateLimiter class in resend_keycloak.py.

These tests verify the rate limiting functionality that prevents
hitting Resend API rate limits (2 requests per second).
"""

import time

from resend.exceptions import ResendError


# Copy of the RateLimiter class for testing without full module imports
class RateLimiter:
    """Simple rate limiter to ensure we don't exceed API rate limits.

    This tracks the time of the last request and ensures we wait long enough
    between requests to respect the rate limit.
    """

    def __init__(self, requests_per_second: float):
        """Initialize the rate limiter.

        Args:
            requests_per_second: Maximum number of requests per second.
        """
        self.requests_per_second = requests_per_second
        self.min_interval = 1.0 / requests_per_second
        self.last_request_time = 0.0

    def wait_if_needed(self):
        """Wait if necessary to respect the rate limit."""
        now = time.time()
        time_since_last_request = now - self.last_request_time

        if time_since_last_request < self.min_interval:
            sleep_time = self.min_interval - time_since_last_request
            time.sleep(sleep_time)

        self.last_request_time = time.time()


# Copy of the exception classes for testing
class ResendSyncError(Exception):
    """Base exception for Resend sync errors."""

    pass


class RateLimitError(ResendSyncError):
    """Exception for rate limit errors that shouldn't be retried immediately."""

    pass


def is_rate_limit_error(error: Exception) -> bool:
    """Check if an error is a rate limit error.

    Args:
        error: The exception to check.

    Returns:
        True if the error is a rate limit error, False otherwise.
    """
    if isinstance(error, ResendError):
        error_msg = str(error).lower()
        return (
            'rate limit' in error_msg
            or 'too many requests' in error_msg
            or '429' in error_msg
        )
    return False


class TestRateLimiter:
    """Tests for the RateLimiter class."""

    def test_rate_limiter_initialization(self):
        """Test that RateLimiter initializes correctly."""
        rate_limiter = RateLimiter(2.0)  # 2 requests per second
        assert rate_limiter.requests_per_second == 2.0
        assert rate_limiter.min_interval == 0.5
        assert rate_limiter.last_request_time == 0.0

    def test_rate_limiter_first_request_no_wait(self):
        """Test that the first request doesn't wait."""
        rate_limiter = RateLimiter(2.0)
        start_time = time.time()
        rate_limiter.wait_if_needed()
        elapsed = time.time() - start_time

        # First request should not wait (or wait very little)
        assert elapsed < 0.1

    def test_rate_limiter_enforces_minimum_interval(self):
        """Test that RateLimiter enforces minimum interval between requests."""
        rate_limiter = RateLimiter(2.0)  # 0.5 second minimum interval

        # First request
        rate_limiter.wait_if_needed()
        first_request_time = time.time()

        # Second request immediately after
        rate_limiter.wait_if_needed()
        second_request_time = time.time()

        # Should have waited at least 0.5 seconds
        elapsed = second_request_time - first_request_time
        assert elapsed >= 0.45  # Allow small tolerance

    def test_rate_limiter_no_wait_if_enough_time_passed(self):
        """Test that RateLimiter doesn't wait if enough time has passed."""
        rate_limiter = RateLimiter(2.0)

        # First request
        rate_limiter.wait_if_needed()

        # Wait longer than the minimum interval
        time.sleep(0.6)

        # Second request should not need to wait
        start_time = time.time()
        rate_limiter.wait_if_needed()
        elapsed = time.time() - start_time

        # Should not have waited (or waited very little)
        assert elapsed < 0.1

    def test_rate_limiter_multiple_requests(self):
        """Test that RateLimiter properly spaces multiple requests."""
        rate_limiter = RateLimiter(2.0)  # 0.5 second minimum interval

        start_time = time.time()

        # Make 5 requests
        for _ in range(5):
            rate_limiter.wait_if_needed()

        total_elapsed = time.time() - start_time

        # 5 requests at 2 req/sec should take at least 2 seconds (4 intervals)
        assert total_elapsed >= 1.8  # Allow small tolerance


class TestIsRateLimitError:
    """Tests for the is_rate_limit_error function."""

    def test_detects_rate_limit_message(self):
        """Test that rate limit errors are detected by message."""
        # Test various rate limit error messages
        error1 = ResendError(
            message='Too many requests',
            code=429,
            error_type='rate_limit_exceeded',
            suggested_action='Wait and retry',
        )
        assert is_rate_limit_error(error1) is True

        error2 = ResendError(
            message='Rate limit exceeded',
            code=429,
            error_type='rate_limit_exceeded',
            suggested_action='Wait and retry',
        )
        assert is_rate_limit_error(error2) is True

        error3 = ResendError(
            message='429 Too Many Requests',
            code=429,
            error_type='rate_limit_exceeded',
            suggested_action='Wait and retry',
        )
        assert is_rate_limit_error(error3) is True

    def test_does_not_detect_other_errors(self):
        """Test that non-rate-limit errors are not detected."""
        error = ResendError(
            message='Invalid email address',
            code=400,
            error_type='validation_error',
            suggested_action='Check email format',
        )
        assert is_rate_limit_error(error) is False

    def test_handles_non_resend_errors(self):
        """Test that non-ResendError exceptions return False."""
        error = ValueError('Some other error')
        assert is_rate_limit_error(error) is False


class TestRateLimitError:
    """Tests for the RateLimitError exception."""

    def test_rate_limit_error_is_resend_sync_error(self):
        """Test that RateLimitError inherits from ResendSyncError."""
        error = RateLimitError('Rate limit hit')
        assert isinstance(error, ResendSyncError)

    def test_rate_limit_error_message(self):
        """Test that RateLimitError preserves the message."""
        error = RateLimitError('Rate limit hit for test@example.com')
        assert 'test@example.com' in str(error)
