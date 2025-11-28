import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";
import * as supaSchema from "../shared/supabase-schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db: NodePgDatabase<any> = drizzle(pool); // Use `any` to bypass type issues
export const tables = { ...schema, ...supaSchema };   // Access tables dynamically