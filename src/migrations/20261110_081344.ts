import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`users_tenants\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`tenant_id\` integer NOT NULL,
    \`role\` text DEFAULT 'viewer' NOT NULL,
    FOREIGN KEY (\`tenant_id\`) REFERENCES \`websites\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_tenants_order_idx\` ON \`users_tenants\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_tenants_parent_id_idx\` ON \`users_tenants\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`users_tenants_tenant_idx\` ON \`users_tenants\` (\`tenant_id\`);`)
  await db.run(sql`CREATE TABLE \`websites\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`slug\` text NOT NULL,
    \`domain\` text NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`websites_slug_idx\` ON \`websites\` (\`slug\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`websites_domain_idx\` ON \`websites\` (\`domain\`);`)
  await db.run(sql`CREATE INDEX \`websites_updated_at_idx\` ON \`websites\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`websites_created_at_idx\` ON \`websites\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`websites_locales\` (
    \`name\` text NOT NULL,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`_locale\` text NOT NULL,
    \`_parent_id\` integer NOT NULL,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`websites\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`websites_locales_locale_parent_id_unique\` ON \`websites_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`websites_locales_parent_id_idx\` ON \`websites_locales\` (\`_parent_id\`);`)
  await db.run(sql`DROP INDEX \`pages_slug_idx\`;`)
  await db.run(sql`ALTER TABLE \`pages\` ADD \`tenant_id\` integer REFERENCES websites(id);`)
  await db.run(sql`CREATE INDEX \`pages_tenant_idx\` ON \`pages\` (\`tenant_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`tenant_slug_idx\` ON \`pages\` (\`tenant_id\`,\`slug\`);`)
  await db.run(sql`CREATE INDEX \`pages_slug_idx\` ON \`pages\` (\`slug\`);`)
  await db.run(sql`DROP INDEX \`posts_slug_idx\`;`)
  await db.run(sql`ALTER TABLE \`posts\` ADD \`tenant_id\` integer REFERENCES websites(id);`)
  await db.run(sql`CREATE INDEX \`posts_tenant_idx\` ON \`posts\` (\`tenant_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`tenant_slug_1_idx\` ON \`posts\` (\`tenant_id\`,\`slug\`);`)
  await db.run(sql`CREATE INDEX \`posts_slug_idx\` ON \`posts\` (\`slug\`);`)
  await db.run(sql`DROP INDEX \`services_slug_idx\`;`)
  await db.run(sql`ALTER TABLE \`services\` ADD \`tenant_id\` integer REFERENCES websites(id);`)
  await db.run(sql`CREATE INDEX \`services_tenant_idx\` ON \`services\` (\`tenant_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`tenant_slug_2_idx\` ON \`services\` (\`tenant_id\`,\`slug\`);`)
  await db.run(sql`CREATE INDEX \`services_slug_idx\` ON \`services\` (\`slug\`);`)
  await db.run(sql`DROP INDEX \`projects_slug_idx\`;`)
  await db.run(sql`ALTER TABLE \`projects\` ADD \`tenant_id\` integer REFERENCES websites(id);`)
  await db.run(sql`CREATE INDEX \`projects_tenant_idx\` ON \`projects\` (\`tenant_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`tenant_slug_3_idx\` ON \`projects\` (\`tenant_id\`,\`slug\`);`)
  await db.run(sql`CREATE INDEX \`projects_slug_idx\` ON \`projects\` (\`slug\`);`)
  await db.run(sql`DROP INDEX \`companies_slug_idx\`;`)
  await db.run(sql`ALTER TABLE \`companies\` ADD \`tenant_id\` integer REFERENCES websites(id);`)
  await db.run(sql`CREATE INDEX \`companies_tenant_idx\` ON \`companies\` (\`tenant_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`tenant_slug_4_idx\` ON \`companies\` (\`tenant_id\`,\`slug\`);`)
  await db.run(sql`CREATE INDEX \`companies_slug_idx\` ON \`companies\` (\`slug\`);`)
  await db.run(sql`DROP INDEX \`team_slug_idx\`;`)
  await db.run(sql`ALTER TABLE \`team\` ADD \`tenant_id\` integer REFERENCES websites(id);`)
  await db.run(sql`CREATE INDEX \`team_tenant_idx\` ON \`team\` (\`tenant_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`tenant_slug_5_idx\` ON \`team\` (\`tenant_id\`,\`slug\`);`)
  await db.run(sql`CREATE INDEX \`team_slug_idx\` ON \`team\` (\`slug\`);`)
  // Preserve all localized rows and global history; no parent tables are dropped.
  await db.run(sql`ALTER TABLE site_settings ADD tenant_id integer REFERENCES websites(id);`)
  await db.run(sql`ALTER TABLE navigation ADD tenant_id integer REFERENCES websites(id);`)
  await db.run(sql`CREATE UNIQUE INDEX site_settings_tenant_idx ON site_settings (tenant_id);`)
  await db.run(sql`CREATE UNIQUE INDEX navigation_tenant_idx ON navigation (tenant_id);`)
  await db.run(sql`CREATE INDEX site_settings_updated_at_idx ON site_settings (updated_at);`)
  await db.run(sql`CREATE INDEX site_settings_created_at_idx ON site_settings (created_at);`)
  await db.run(sql`CREATE INDEX navigation_updated_at_idx ON navigation (updated_at);`)
  await db.run(sql`CREATE INDEX navigation_created_at_idx ON navigation (created_at);`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`tenant_id\` integer REFERENCES websites(id);`)
  await db.run(sql`CREATE INDEX \`media_tenant_idx\` ON \`media\` (\`tenant_id\`);`)
  await db.run(sql`ALTER TABLE \`_pages_v\` ADD \`version_tenant_id\` integer REFERENCES websites(id);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_tenant_idx\` ON \`_pages_v\` (\`version_tenant_id\`);`)
  await db.run(sql`CREATE INDEX \`version_tenant_version_slug_idx\` ON \`_pages_v\` (\`version_tenant_id\`,\`version_slug\`);`)
  await db.run(sql`ALTER TABLE \`_posts_v\` ADD \`version_tenant_id\` integer REFERENCES websites(id);`)
  await db.run(sql`CREATE INDEX \`_posts_v_version_version_tenant_idx\` ON \`_posts_v\` (\`version_tenant_id\`);`)
  await db.run(sql`CREATE INDEX \`version_tenant_version_slug_1_idx\` ON \`_posts_v\` (\`version_tenant_id\`,\`version_slug\`);`)
  await db.run(sql`ALTER TABLE \`_services_v\` ADD \`version_tenant_id\` integer REFERENCES websites(id);`)
  await db.run(sql`CREATE INDEX \`_services_v_version_version_tenant_idx\` ON \`_services_v\` (\`version_tenant_id\`);`)
  await db.run(sql`CREATE INDEX \`version_tenant_version_slug_2_idx\` ON \`_services_v\` (\`version_tenant_id\`,\`version_slug\`);`)
  await db.run(sql`ALTER TABLE \`_projects_v\` ADD \`version_tenant_id\` integer REFERENCES websites(id);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_version_tenant_idx\` ON \`_projects_v\` (\`version_tenant_id\`);`)
  await db.run(sql`CREATE INDEX \`version_tenant_version_slug_3_idx\` ON \`_projects_v\` (\`version_tenant_id\`,\`version_slug\`);`)
  await db.run(sql`ALTER TABLE \`_companies_v\` ADD \`version_tenant_id\` integer REFERENCES websites(id);`)
  await db.run(sql`CREATE INDEX \`_companies_v_version_version_tenant_idx\` ON \`_companies_v\` (\`version_tenant_id\`);`)
  await db.run(sql`CREATE INDEX \`version_tenant_version_slug_4_idx\` ON \`_companies_v\` (\`version_tenant_id\`,\`version_slug\`);`)
  await db.run(sql`ALTER TABLE \`_team_v\` ADD \`version_tenant_id\` integer REFERENCES websites(id);`)
  await db.run(sql`CREATE INDEX \`_team_v_version_version_tenant_idx\` ON \`_team_v\` (\`version_tenant_id\`);`)
  await db.run(sql`CREATE INDEX \`version_tenant_version_slug_5_idx\` ON \`_team_v\` (\`version_tenant_id\`,\`version_slug\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`websites_id\` integer REFERENCES websites(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`site_settings_id\` integer REFERENCES site_settings(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`navigation_id\` integer REFERENCES navigation(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_websites_id_idx\` ON \`payload_locked_documents_rels\` (\`websites_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_site_settings_id_idx\` ON \`payload_locked_documents_rels\` (\`site_settings_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_navigation_id_idx\` ON \`payload_locked_documents_rels\` (\`navigation_id\`);`)
  await db.run(sql`ALTER TABLE \`_site_settings_v\` ADD \`parent_id\` integer REFERENCES site_settings(id);`)
  await db.run(sql`ALTER TABLE \`_site_settings_v\` ADD \`version_tenant_id\` integer REFERENCES websites(id);`)
  await db.run(sql`CREATE INDEX \`_site_settings_v_parent_idx\` ON \`_site_settings_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_site_settings_v_version_version_tenant_idx\` ON \`_site_settings_v\` (\`version_tenant_id\`);`)
  await db.run(sql`CREATE INDEX \`_site_settings_v_version_version_updated_at_idx\` ON \`_site_settings_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_site_settings_v_version_version_created_at_idx\` ON \`_site_settings_v\` (\`version_created_at\`);`)
  await db.run(sql`ALTER TABLE \`_navigation_v\` ADD \`parent_id\` integer REFERENCES navigation(id);`)
  await db.run(sql`ALTER TABLE \`_navigation_v\` ADD \`version_tenant_id\` integer REFERENCES websites(id);`)
  await db.run(sql`CREATE INDEX \`_navigation_v_parent_idx\` ON \`_navigation_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_navigation_v_version_version_tenant_idx\` ON \`_navigation_v\` (\`version_tenant_id\`);`)
  await db.run(sql`CREATE INDEX \`_navigation_v_version_version_updated_at_idx\` ON \`_navigation_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_navigation_v_version_version_created_at_idx\` ON \`_navigation_v\` (\`version_created_at\`);`)
  // Existing single-site data belongs to Company A. Company B starts empty.
  await db.run(sql`INSERT INTO websites (id, slug, domain) VALUES (1, 'company-a', 'localhost'), (2, 'company-b', '127.0.0.1');`)
  await db.run(sql`INSERT INTO websites_locales (name, _locale, _parent_id) VALUES ('Company A', 'en', 1), ('الشركة أ', 'ar', 1), ('Company B', 'en', 2), ('الشركة ب', 'ar', 2);`)
  await db.run(sql`UPDATE media SET tenant_id = 1;`)
  await db.run(sql`UPDATE pages SET tenant_id = 1;`)
  await db.run(sql`UPDATE posts SET tenant_id = 1;`)
  await db.run(sql`UPDATE services SET tenant_id = 1;`)
  await db.run(sql`UPDATE projects SET tenant_id = 1;`)
  await db.run(sql`UPDATE companies SET tenant_id = 1;`)
  await db.run(sql`UPDATE team SET tenant_id = 1;`)
  await db.run(sql`UPDATE site_settings SET tenant_id = 1;`)
  await db.run(sql`UPDATE navigation SET tenant_id = 1;`)
  await db.run(sql`UPDATE _pages_v SET version_tenant_id = 1;`)
  await db.run(sql`UPDATE _posts_v SET version_tenant_id = 1;`)
  await db.run(sql`UPDATE _services_v SET version_tenant_id = 1;`)
  await db.run(sql`UPDATE _projects_v SET version_tenant_id = 1;`)
  await db.run(sql`UPDATE _companies_v SET version_tenant_id = 1;`)
  await db.run(sql`UPDATE _team_v SET version_tenant_id = 1;`)
  await db.run(sql`UPDATE _site_settings_v SET version_tenant_id = 1;`)
  await db.run(sql`UPDATE _navigation_v SET version_tenant_id = 1;`)
  await db.run(sql`UPDATE _site_settings_v SET parent_id = (SELECT id FROM site_settings LIMIT 1);`)
  await db.run(sql`UPDATE _navigation_v SET parent_id = (SELECT id FROM navigation LIMIT 1);`)
  await db.run(sql`INSERT INTO users_tenants (_order, _parent_id, id, tenant_id, role) SELECT 1, id, 'legacy-' || id, 1, role FROM users WHERE role != 'admin';`)

}

export async function down(_args: MigrateDownArgs): Promise<void> {
  throw new Error('Multi-website data cannot safely merge into a single website. Restore the pre-upgrade database and media backup instead.')
}
