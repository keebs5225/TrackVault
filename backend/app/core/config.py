# backend/app/core/config.py

import os
from dotenv import load_dotenv

# 1) Load .env file at project root
load_dotenv()

# 2) Pull in our secrets (with sensible defaults/fallbacks)
SECRET_KEY                 = os.getenv("SECRET_KEY")
ALGORITHM                  = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_DURATION"))
