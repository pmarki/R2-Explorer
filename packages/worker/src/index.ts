import { cloudflareAccess } from "@hono/cloudflare-access";
import {
	type OpenAPIObjectConfigV31,
	extendZodWithOpenApi,
	fromHono,
} from "chanfana";
import { type ExecutionContext, Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { cors } from "hono/cors";
import { z } from "zod";
import { buildConfigFromEnv } from "./foundation/envConfig";
import { readOnlyMiddleware } from "./foundation/middlewares/readonly";
import { settings } from "./foundation/settings";
import { CopyObject } from "./modules/buckets/copyObject";
import { CreateFolder } from "./modules/buckets/createFolder";
import { CreateShareLink } from "./modules/buckets/createShareLink";
import { DeleteObject } from "./modules/buckets/deleteObject";
import { DeleteShareLink } from "./modules/buckets/deleteShareLink";
import { GetObject } from "./modules/buckets/getObject";
import { GetShareLink } from "./modules/buckets/getShareLink";
import { HeadObject } from "./modules/buckets/headObject";
import { ListObjects } from "./modules/buckets/listObjects";
import { ListShares } from "./modules/buckets/listShares";
import { MoveObject } from "./modules/buckets/moveObject";
import { CompleteUpload } from "./modules/buckets/multipart/completeUpload";
import { CreateUpload } from "./modules/buckets/multipart/createUpload";
import { PartUpload } from "./modules/buckets/multipart/partUpload";
import { PutMetadata } from "./modules/buckets/putMetadata";
import { PutObject } from "./modules/buckets/putObject";
import { dashboardIndex, dashboardRedirect } from "./modules/dashboard";
import { receiveEmail } from "./modules/emails/receiveEmail";
import { SendEmail } from "./modules/emails/sendEmail";
import { GetInfo } from "./modules/server/getInfo";
import type {
	AppContext,
	AppEnv,
	AppVariables,
	BasicAuthType,
	R2ExplorerConfig,
} from "./types";

const configDefaults: Partial<R2ExplorerConfig> = { readonly: true };

export function R2Explorer(config?: R2ExplorerConfig) {
	extendZodWithOpenApi(z);
	config = config || {};

	const openapiSchema: OpenAPIObjectConfigV31 = {
		openapi: "3.1.0",
		info: {
			title: "R2 Explorer API",
			version: settings.version,
		},
	};

	if (config.basicAuth) {
		openapiSchema["security"] = [
			{
				basicAuth: [],
			},
		];
	}

	const app = new Hono<{ Bindings: AppEnv; Variables: AppVariables }>();

	// Merge defaults, ENV-based config, and static config on every request.
	// Priority: static config > ENV vars > defaults.
	app.use("*", async (c, next) => {
		c.set("config", {
			...configDefaults,
			...buildConfigFromEnv(c.env),
			...config,
		});
		await next();
	});

	const openapi = fromHono(app, {
		schema: openapiSchema,
		raiseUnknownParameters: true,
		generateOperationIds: false,
	});

	// CORS — checked per request so ENV vars take effect
	app.use("/api/*", async (c, next) => {
		if (c.get("config").cors === true) {
			return cors()(c, next);
		}
		return next();
	});

	// Readonly — already reads from config at request time
	app.use("/api/*", readOnlyMiddleware);

	// Cloudflare Access — checked per request so ENV vars take effect
	app.use("/api/*", async (c, next) => {
		const { cfAccessTeamName } = c.get("config");
		if (!cfAccessTeamName) {
			return next();
		}
		return cloudflareAccess(cfAccessTeamName)(c, async () => {
			c.set("authentication_type", "cloudflare-access");
			c.set("authentication_username", c.get("accessPayload").email);
			await next();
		});
	});

	// Basic auth — checked per request so ENV vars take effect
	if (config.basicAuth) {
		openapi.registry.registerComponent("securitySchemes", "basicAuth", {
			type: "http",
			scheme: "basic",
		});
	}
	app.use("/api/*", async (c, next) => {
		const basicAuthConfig = c.get("config").basicAuth;
		if (!basicAuthConfig) {
			return next();
		}
		return basicAuth({
			invalidUserMessage: "Authentication error: Basic Auth required",
			verifyUser: (username, password, ctx: AppContext) => {
				const users = (
					Array.isArray(basicAuthConfig) ? basicAuthConfig : [basicAuthConfig]
				) as BasicAuthType[];

				for (const user of users) {
					if (user.username === username && user.password === password) {
						ctx.set("authentication_type", "basic-auth");
						ctx.set("authentication_username", username);
						return true;
					}
				}

				return false;
			},
		})(c, next);
	});

	openapi.get("/api/server/config", GetInfo);

	openapi.get("/api/buckets/:bucket", ListObjects);
	openapi.post("/api/buckets/:bucket/move", MoveObject);
	openapi.post("/api/buckets/:bucket/copy", CopyObject);
	openapi.post("/api/buckets/:bucket/folder", CreateFolder);
	openapi.post("/api/buckets/:bucket/upload", PutObject);
	openapi.post("/api/buckets/:bucket/multipart/create", CreateUpload);
	openapi.post("/api/buckets/:bucket/multipart/upload", PartUpload);
	openapi.post("/api/buckets/:bucket/multipart/complete", CompleteUpload);
	openapi.post("/api/buckets/:bucket/delete", DeleteObject);
	openapi.on("head", "/api/buckets/:bucket/:key", HeadObject);
	openapi.get("/api/buckets/:bucket/:key/head", HeadObject); // There are some issues with calling the head method

	// Share link routes
	openapi.post("/api/buckets/:bucket/:key/share", CreateShareLink);
	openapi.get("/api/buckets/:bucket/shares", ListShares);
	openapi.delete("/api/buckets/:bucket/share/:shareId", DeleteShareLink);

	// These object routes should be defined last
	openapi.get("/api/buckets/:bucket/:key", GetObject);
	openapi.post("/api/buckets/:bucket/:key", PutMetadata);

	openapi.post("/api/emails/send", SendEmail);

	// Public share access (no authentication required)
	openapi.get("/share/:shareId", GetShareLink);

	openapi.get("/", dashboardIndex);
	openapi.get("*", dashboardRedirect);

	app.all("*", () =>
		Response.json({ msg: "404, not found!" }, { status: 404 }),
	);

	return {
		// TODO: improve event type
		async email(
			event: { raw: unknown; rawSize: unknown },
			env: AppEnv,
			context: ExecutionContext,
		) {
			const mergedConfig = {
				...configDefaults,
				...buildConfigFromEnv(env),
				...config,
			};
			await receiveEmail(event, env, context, mergedConfig);
		},
		async fetch(request: Request, env: unknown, context: ExecutionContext) {
			return app.fetch(request, env as AppEnv, context);
		},
	};
}
