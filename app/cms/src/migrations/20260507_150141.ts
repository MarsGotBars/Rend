import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`description\` text NOT NULL,
  	\`thumb_image_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`thumb_image_id\`) REFERENCES \`images\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_slug_idx\` ON \`pages\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`pages_thumb_image_idx\` ON \`pages\` (\`thumb_image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_updated_at_idx\` ON \`pages\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`pages_created_at_idx\` ON \`pages\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`pages_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`images_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`images_id\`) REFERENCES \`images\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_rels_order_idx\` ON \`pages_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_parent_idx\` ON \`pages_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_path_idx\` ON \`pages_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_images_id_idx\` ON \`pages_rels\` (\`images_id\`);`)
  await db.run(sql`CREATE TABLE \`images\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`alt\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric,
  	\`sizes_xs_webp_url\` text,
  	\`sizes_xs_webp_width\` numeric,
  	\`sizes_xs_webp_height\` numeric,
  	\`sizes_xs_webp_mime_type\` text,
  	\`sizes_xs_webp_filesize\` numeric,
  	\`sizes_xs_webp_filename\` text,
  	\`sizes_xs_avif_url\` text,
  	\`sizes_xs_avif_width\` numeric,
  	\`sizes_xs_avif_height\` numeric,
  	\`sizes_xs_avif_mime_type\` text,
  	\`sizes_xs_avif_filesize\` numeric,
  	\`sizes_xs_avif_filename\` text,
  	\`sizes_sm_webp_url\` text,
  	\`sizes_sm_webp_width\` numeric,
  	\`sizes_sm_webp_height\` numeric,
  	\`sizes_sm_webp_mime_type\` text,
  	\`sizes_sm_webp_filesize\` numeric,
  	\`sizes_sm_webp_filename\` text,
  	\`sizes_sm_avif_url\` text,
  	\`sizes_sm_avif_width\` numeric,
  	\`sizes_sm_avif_height\` numeric,
  	\`sizes_sm_avif_mime_type\` text,
  	\`sizes_sm_avif_filesize\` numeric,
  	\`sizes_sm_avif_filename\` text,
  	\`sizes_md_webp_url\` text,
  	\`sizes_md_webp_width\` numeric,
  	\`sizes_md_webp_height\` numeric,
  	\`sizes_md_webp_mime_type\` text,
  	\`sizes_md_webp_filesize\` numeric,
  	\`sizes_md_webp_filename\` text,
  	\`sizes_md_avif_url\` text,
  	\`sizes_md_avif_width\` numeric,
  	\`sizes_md_avif_height\` numeric,
  	\`sizes_md_avif_mime_type\` text,
  	\`sizes_md_avif_filesize\` numeric,
  	\`sizes_md_avif_filename\` text,
  	\`sizes_lg_webp_url\` text,
  	\`sizes_lg_webp_width\` numeric,
  	\`sizes_lg_webp_height\` numeric,
  	\`sizes_lg_webp_mime_type\` text,
  	\`sizes_lg_webp_filesize\` numeric,
  	\`sizes_lg_webp_filename\` text,
  	\`sizes_lg_avif_url\` text,
  	\`sizes_lg_avif_width\` numeric,
  	\`sizes_lg_avif_height\` numeric,
  	\`sizes_lg_avif_mime_type\` text,
  	\`sizes_lg_avif_filesize\` numeric,
  	\`sizes_lg_avif_filename\` text,
  	\`sizes_xl_webp_url\` text,
  	\`sizes_xl_webp_width\` numeric,
  	\`sizes_xl_webp_height\` numeric,
  	\`sizes_xl_webp_mime_type\` text,
  	\`sizes_xl_webp_filesize\` numeric,
  	\`sizes_xl_webp_filename\` text,
  	\`sizes_xl_avif_url\` text,
  	\`sizes_xl_avif_width\` numeric,
  	\`sizes_xl_avif_height\` numeric,
  	\`sizes_xl_avif_mime_type\` text,
  	\`sizes_xl_avif_filesize\` numeric,
  	\`sizes_xl_avif_filename\` text,
  	\`sizes_xs_2x_webp_url\` text,
  	\`sizes_xs_2x_webp_width\` numeric,
  	\`sizes_xs_2x_webp_height\` numeric,
  	\`sizes_xs_2x_webp_mime_type\` text,
  	\`sizes_xs_2x_webp_filesize\` numeric,
  	\`sizes_xs_2x_webp_filename\` text,
  	\`sizes_xs_2x_avif_url\` text,
  	\`sizes_xs_2x_avif_width\` numeric,
  	\`sizes_xs_2x_avif_height\` numeric,
  	\`sizes_xs_2x_avif_mime_type\` text,
  	\`sizes_xs_2x_avif_filesize\` numeric,
  	\`sizes_xs_2x_avif_filename\` text,
  	\`sizes_sm_2x_webp_url\` text,
  	\`sizes_sm_2x_webp_width\` numeric,
  	\`sizes_sm_2x_webp_height\` numeric,
  	\`sizes_sm_2x_webp_mime_type\` text,
  	\`sizes_sm_2x_webp_filesize\` numeric,
  	\`sizes_sm_2x_webp_filename\` text,
  	\`sizes_sm_2x_avif_url\` text,
  	\`sizes_sm_2x_avif_width\` numeric,
  	\`sizes_sm_2x_avif_height\` numeric,
  	\`sizes_sm_2x_avif_mime_type\` text,
  	\`sizes_sm_2x_avif_filesize\` numeric,
  	\`sizes_sm_2x_avif_filename\` text,
  	\`sizes_md_2x_webp_url\` text,
  	\`sizes_md_2x_webp_width\` numeric,
  	\`sizes_md_2x_webp_height\` numeric,
  	\`sizes_md_2x_webp_mime_type\` text,
  	\`sizes_md_2x_webp_filesize\` numeric,
  	\`sizes_md_2x_webp_filename\` text,
  	\`sizes_md_2x_avif_url\` text,
  	\`sizes_md_2x_avif_width\` numeric,
  	\`sizes_md_2x_avif_height\` numeric,
  	\`sizes_md_2x_avif_mime_type\` text,
  	\`sizes_md_2x_avif_filesize\` numeric,
  	\`sizes_md_2x_avif_filename\` text,
  	\`sizes_lg_2x_webp_url\` text,
  	\`sizes_lg_2x_webp_width\` numeric,
  	\`sizes_lg_2x_webp_height\` numeric,
  	\`sizes_lg_2x_webp_mime_type\` text,
  	\`sizes_lg_2x_webp_filesize\` numeric,
  	\`sizes_lg_2x_webp_filename\` text,
  	\`sizes_lg_2x_avif_url\` text,
  	\`sizes_lg_2x_avif_width\` numeric,
  	\`sizes_lg_2x_avif_height\` numeric,
  	\`sizes_lg_2x_avif_mime_type\` text,
  	\`sizes_lg_2x_avif_filesize\` numeric,
  	\`sizes_lg_2x_avif_filename\` text,
  	\`sizes_xl_2x_webp_url\` text,
  	\`sizes_xl_2x_webp_width\` numeric,
  	\`sizes_xl_2x_webp_height\` numeric,
  	\`sizes_xl_2x_webp_mime_type\` text,
  	\`sizes_xl_2x_webp_filesize\` numeric,
  	\`sizes_xl_2x_webp_filename\` text,
  	\`sizes_xl_2x_avif_url\` text,
  	\`sizes_xl_2x_avif_width\` numeric,
  	\`sizes_xl_2x_avif_height\` numeric,
  	\`sizes_xl_2x_avif_mime_type\` text,
  	\`sizes_xl_2x_avif_filesize\` numeric,
  	\`sizes_xl_2x_avif_filename\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`images_updated_at_idx\` ON \`images\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`images_created_at_idx\` ON \`images\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`images_filename_idx\` ON \`images\` (\`filename\`);`)
  await db.run(sql`CREATE INDEX \`images_sizes_xs_webp_sizes_xs_webp_filename_idx\` ON \`images\` (\`sizes_xs_webp_filename\`);`)
  await db.run(sql`CREATE INDEX \`images_sizes_xs_avif_sizes_xs_avif_filename_idx\` ON \`images\` (\`sizes_xs_avif_filename\`);`)
  await db.run(sql`CREATE INDEX \`images_sizes_sm_webp_sizes_sm_webp_filename_idx\` ON \`images\` (\`sizes_sm_webp_filename\`);`)
  await db.run(sql`CREATE INDEX \`images_sizes_sm_avif_sizes_sm_avif_filename_idx\` ON \`images\` (\`sizes_sm_avif_filename\`);`)
  await db.run(sql`CREATE INDEX \`images_sizes_md_webp_sizes_md_webp_filename_idx\` ON \`images\` (\`sizes_md_webp_filename\`);`)
  await db.run(sql`CREATE INDEX \`images_sizes_md_avif_sizes_md_avif_filename_idx\` ON \`images\` (\`sizes_md_avif_filename\`);`)
  await db.run(sql`CREATE INDEX \`images_sizes_lg_webp_sizes_lg_webp_filename_idx\` ON \`images\` (\`sizes_lg_webp_filename\`);`)
  await db.run(sql`CREATE INDEX \`images_sizes_lg_avif_sizes_lg_avif_filename_idx\` ON \`images\` (\`sizes_lg_avif_filename\`);`)
  await db.run(sql`CREATE INDEX \`images_sizes_xl_webp_sizes_xl_webp_filename_idx\` ON \`images\` (\`sizes_xl_webp_filename\`);`)
  await db.run(sql`CREATE INDEX \`images_sizes_xl_avif_sizes_xl_avif_filename_idx\` ON \`images\` (\`sizes_xl_avif_filename\`);`)
  await db.run(sql`CREATE INDEX \`images_sizes_xs_2x_webp_sizes_xs_2x_webp_filename_idx\` ON \`images\` (\`sizes_xs_2x_webp_filename\`);`)
  await db.run(sql`CREATE INDEX \`images_sizes_xs_2x_avif_sizes_xs_2x_avif_filename_idx\` ON \`images\` (\`sizes_xs_2x_avif_filename\`);`)
  await db.run(sql`CREATE INDEX \`images_sizes_sm_2x_webp_sizes_sm_2x_webp_filename_idx\` ON \`images\` (\`sizes_sm_2x_webp_filename\`);`)
  await db.run(sql`CREATE INDEX \`images_sizes_sm_2x_avif_sizes_sm_2x_avif_filename_idx\` ON \`images\` (\`sizes_sm_2x_avif_filename\`);`)
  await db.run(sql`CREATE INDEX \`images_sizes_md_2x_webp_sizes_md_2x_webp_filename_idx\` ON \`images\` (\`sizes_md_2x_webp_filename\`);`)
  await db.run(sql`CREATE INDEX \`images_sizes_md_2x_avif_sizes_md_2x_avif_filename_idx\` ON \`images\` (\`sizes_md_2x_avif_filename\`);`)
  await db.run(sql`CREATE INDEX \`images_sizes_lg_2x_webp_sizes_lg_2x_webp_filename_idx\` ON \`images\` (\`sizes_lg_2x_webp_filename\`);`)
  await db.run(sql`CREATE INDEX \`images_sizes_lg_2x_avif_sizes_lg_2x_avif_filename_idx\` ON \`images\` (\`sizes_lg_2x_avif_filename\`);`)
  await db.run(sql`CREATE INDEX \`images_sizes_xl_2x_webp_sizes_xl_2x_webp_filename_idx\` ON \`images\` (\`sizes_xl_2x_webp_filename\`);`)
  await db.run(sql`CREATE INDEX \`images_sizes_xl_2x_avif_sizes_xl_2x_avif_filename_idx\` ON \`images\` (\`sizes_xl_2x_avif_filename\`);`)
  await db.run(sql`CREATE TABLE \`videos\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric
  );
  `)
  await db.run(sql`CREATE INDEX \`videos_updated_at_idx\` ON \`videos\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`videos_created_at_idx\` ON \`videos\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`videos_filename_idx\` ON \`videos\` (\`filename\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`pages_id\` integer,
  	\`images_id\` integer,
  	\`videos_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`images_id\`) REFERENCES \`images\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`videos_id\`) REFERENCES \`videos\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_images_id_idx\` ON \`payload_locked_documents_rels\` (\`images_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_videos_id_idx\` ON \`payload_locked_documents_rels\` (\`videos_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`pages\`;`)
  await db.run(sql`DROP TABLE \`pages_rels\`;`)
  await db.run(sql`DROP TABLE \`images\`;`)
  await db.run(sql`DROP TABLE \`videos\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
}
