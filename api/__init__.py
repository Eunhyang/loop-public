# LOOP Dashboard API Package
#
# Setup path for shared module import
# This must run before any module imports 'shared.*'
import sys
from pathlib import Path

# Add public/ to path so 'shared' package can be imported
_PUBLIC_DIR = Path(__file__).parent.parent
if str(_PUBLIC_DIR) not in sys.path:
    sys.path.insert(0, str(_PUBLIC_DIR))
