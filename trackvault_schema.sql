-- ================================================
-- trackvault_schema.sql
-- ================================================

-- 1) ENUM Types (“building materials”)
CREATE TYPE account_type AS ENUM ('checking','savings','credit','cash');
CREATE TYPE category_type AS ENUM ('income','expense');
CREATE TYPE frequency_type AS ENUM ('daily','weekly','monthly','yearly');
CREATE TYPE budget_period AS ENUM ('weekly','monthly','yearly');

-- 2) User table (“core user room”)
CREATE TABLE "User" (
  user_id       SERIAL    PRIMARY KEY,
  name          TEXT      NOT NULL,
  email         TEXT      NOT NULL UNIQUE,
  password_hash TEXT      NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3) Account table (“financial accounts room”)
CREATE TABLE Account (
  account_id   SERIAL        PRIMARY KEY,
  user_id      INTEGER       NOT NULL
                REFERENCES "User"(user_id) ON DELETE CASCADE,
  name         TEXT          NOT NULL,
  account_type account_type  NOT NULL,
  balance      NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- 4) Category table (“grouping room”)
CREATE TABLE Category (
  category_id        SERIAL        PRIMARY KEY,
  user_id            INTEGER       NOT NULL
                       REFERENCES "User"(user_id) ON DELETE CASCADE,
  name               TEXT          NOT NULL,
  type               category_type NOT NULL,
  parent_category_id INTEGER
                       REFERENCES Category(category_id) ON DELETE SET NULL,
  created_at         TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- 5) RecurringTransaction table (“template room”)
CREATE TABLE RecurringTransaction (
  recurring_id  SERIAL         PRIMARY KEY,
  user_id       INTEGER        NOT NULL
                  REFERENCES "User"(user_id) ON DELETE CASCADE,
  account_id    INTEGER        NOT NULL
                  REFERENCES Account(account_id) ON DELETE CASCADE,
  amount        NUMERIC(12,2)  NOT NULL,
  category_id   INTEGER        NOT NULL
                  REFERENCES Category(category_id),
  frequency     frequency_type NOT NULL,
  start_date    DATE           NOT NULL,
  end_date      DATE,
  next_run_date DATE           NOT NULL,
  created_at    TIMESTAMP      NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- 6) Transaction table (“money movement room”)
CREATE TABLE "Transaction" (
  transaction_id   SERIAL         PRIMARY KEY,
  user_id          INTEGER        NOT NULL
                     REFERENCES "User"(user_id) ON DELETE CASCADE,
  account_id       INTEGER        NOT NULL
                     REFERENCES Account(account_id) ON DELETE CASCADE,
  amount           NUMERIC(12,2)  NOT NULL,
  currency         VARCHAR(3)     NOT NULL,
  transaction_date TIMESTAMP      NOT NULL,
  category_id      INTEGER        NOT NULL
                     REFERENCES Category(category_id),
  description      TEXT,
  receipt_url      TEXT,
  is_recurring     BOOLEAN        NOT NULL DEFAULT FALSE,
  recurring_id     INTEGER
                     REFERENCES RecurringTransaction(recurring_id) ON DELETE SET NULL,
  created_at       TIMESTAMP      NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- 7) Budget table (“spending limit room”)
CREATE TABLE Budget (
  budget_id    SERIAL         PRIMARY KEY,
  user_id      INTEGER        NOT NULL
                  REFERENCES "User"(user_id),
  category_id  INTEGER        NOT NULL
                  REFERENCES Category(category_id),
  amount_limit NUMERIC(12,2)  NOT NULL,
  period       budget_period  NOT NULL,
  start_date   DATE           NOT NULL,
  end_date     DATE,
  created_at   TIMESTAMP      NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- 8) Receipt table (“file info room”)
CREATE TABLE Receipt (
  receipt_id     SERIAL    PRIMARY KEY,
  transaction_id INTEGER   NOT NULL
                     REFERENCES "Transaction"(transaction_id) ON DELETE CASCADE,
  file_path      TEXT      NOT NULL,
  uploaded_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 9) Tag table (“labels room”)
CREATE TABLE Tag (
  tag_id SERIAL PRIMARY KEY,
  name   TEXT   NOT NULL
);

-- 10) TransactionTag join table (“connector door”)
CREATE TABLE TransactionTag (
  transaction_id INTEGER NOT NULL
                     REFERENCES "Transaction"(transaction_id) ON DELETE CASCADE,
  tag_id         INTEGER NOT NULL
                     REFERENCES Tag(tag_id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, tag_id)
);

-- 11) Indexes for speed
CREATE INDEX idx_transactions_date ON "Transaction"(transaction_date);
CREATE INDEX idx_account_user      ON Account(user_id);
CREATE INDEX idx_category_user     ON Category(user_id);
CREATE INDEX idx_budget_user       ON Budget(user_id);
