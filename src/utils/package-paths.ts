import { fileURLToPath } from "url";
import path from "path";

const PACKAGE_ROOT = fileURLToPath(new URL("../..", import.meta.url));

const SCHEMAS_DIR = path.join(PACKAGE_ROOT, "schemas");
const DEFAULT_SCHEMA = path.join(PACKAGE_ROOT, "schemas/default/schema.yaml");

export { PACKAGE_ROOT, SCHEMAS_DIR, DEFAULT_SCHEMA };
