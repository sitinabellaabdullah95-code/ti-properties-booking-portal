CREATE TABLE quotations (id TEXT PRIMARY KEY NOT NULL, ref TEXT NOT NULL, title TEXT NOT NULL, customer TEXT NOT NULL, event_date TEXT NOT NULL, event_type TEXT NOT NULL, month TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', revision INTEGER NOT NULL DEFAULT 1, payload TEXT NOT NULL, manager_comment TEXT NOT NULL DEFAULT '', submitted_at TEXT, approved_at TEXT, approved_by TEXT, approved_revision INTEGER, pdf_key TEXT, pdf_hash TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL);
--> statement-breakpoint
CREATE INDEX quotes_folder_idx ON quotations(month,event_type,updated_at);
--> statement-breakpoint
CREATE TABLE quotation_history (id TEXT PRIMARY KEY NOT NULL, quote_id TEXT NOT NULL REFERENCES quotations(id), revision INTEGER NOT NULL, action TEXT NOT NULL, actor_email TEXT NOT NULL, comment TEXT NOT NULL DEFAULT '', at TEXT NOT NULL);
--> statement-breakpoint
CREATE INDEX history_quote_idx ON quotation_history(quote_id,at);
