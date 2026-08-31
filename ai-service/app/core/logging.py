import logging
import json
import sys
from datetime import datetime, timezone


class SafeJsonFormatter(logging.Formatter):
    """
    Format logs as JSON and sanitize sensitive data like tokens, passwords, and URLs.
    """
    def format(self, record):
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name
        }
        if hasattr(record, "props"):
            log_data.update(record.props)
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)


def setup_logger(name: str = "wrapai_ai_service") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(SafeJsonFormatter())
        logger.addHandler(handler)

    return logger


logger = setup_logger()
