import type { CloudflareAccessVariables } from "@hono/cloudflare-access";
import type { Context } from "hono";

export type BasicAuthType = {
	username: string;
	password: string;
};

export type BasicAuth = BasicAuthType;

export type BucketConfig = {
	publicUrl?: string;
};

export type R2ExplorerConfig = {
	readonly?: boolean;
	cors?: boolean;
	cfAccessTeamName?: string;
	dashboardUrl?: string;
	emailRouting?:
		| {
				targetBucket: string;
		  }
		| false;
	showHiddenFiles?: boolean;
	basicAuth?: BasicAuth | BasicAuth[];
	buckets?: Record<string, BucketConfig>;
};

export type ShareMetadata = {
	bucket: string;
	key: string;
	expiresAt?: number;
	passwordHash?: string;
	maxDownloads?: number;
	currentDownloads: number;
	createdBy: string;
	createdAt: number;
};

export type AppEnv = {
	ASSETS: Fetcher;
	R2_EXPLORER_READONLY?: string;
	R2_EXPLORER_CORS?: string;
	R2_EXPLORER_CF_ACCESS_TEAM_NAME?: string;
	R2_EXPLORER_SHOW_HIDDEN_FILES?: string;
	R2_EXPLORER_DASHBOARD_URL?: string;
	R2_EXPLORER_BASIC_AUTH_USERNAME?: string;
	R2_EXPLORER_BASIC_AUTH_PASSWORD?: string;
	R2_EXPLORER_EMAIL_ROUTING_TARGET_BUCKET?: string;
	[key: string]: R2Bucket | string | Fetcher | undefined;
};
export type AppVariables = {
	config: R2ExplorerConfig;
	authentication_type?: string;
	authentication_username?: string;
} & CloudflareAccessVariables;
export type AppContext = Context<{ Bindings: AppEnv; Variables: AppVariables }>;
