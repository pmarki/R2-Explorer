import type { AppEnv, BasicAuthType, R2ExplorerConfig } from "../types";

export function buildConfigFromEnv(env: AppEnv): Partial<R2ExplorerConfig> {
	const config: Partial<R2ExplorerConfig> = {};

	if (env.R2_EXPLORER_READONLY !== undefined) {
		config.readonly = env.R2_EXPLORER_READONLY !== "false";
	}
	if (env.R2_EXPLORER_CORS !== undefined) {
		config.cors = env.R2_EXPLORER_CORS === "true";
	}
	if (env.R2_EXPLORER_CF_ACCESS_TEAM_NAME) {
		config.cfAccessTeamName = env.R2_EXPLORER_CF_ACCESS_TEAM_NAME;
	}
	if (env.R2_EXPLORER_SHOW_HIDDEN_FILES !== undefined) {
		config.showHiddenFiles = env.R2_EXPLORER_SHOW_HIDDEN_FILES === "true";
	}
	if (env.R2_EXPLORER_DASHBOARD_URL) {
		config.dashboardUrl = env.R2_EXPLORER_DASHBOARD_URL;
	}
	if (env.R2_EXPLORER_EMAIL_ROUTING_TARGET_BUCKET) {
		config.emailRouting = {
			targetBucket: env.R2_EXPLORER_EMAIL_ROUTING_TARGET_BUCKET,
		};
	}
	if (
		env.R2_EXPLORER_BASIC_AUTH_USERNAME &&
		env.R2_EXPLORER_BASIC_AUTH_PASSWORD
	) {
		config.basicAuth = {
			username: env.R2_EXPLORER_BASIC_AUTH_USERNAME,
			password: env.R2_EXPLORER_BASIC_AUTH_PASSWORD,
		} satisfies BasicAuthType;
	}
	if (env.R2_EXPLORER_SHARES === "false") {
		config.shares = false;
	}

	return config;
}
