import { resolveSchema } from "./artifact/schema/resolver.js";
import type { ChangeContext } from "./types.js";
import { ArtifactGraph } from "./artifact/graph.js";
import { ApplyContext } from "./apply/context.js";
import { getCompletedArtifacts } from "./artifact/completion.js";
import { DesignContext } from "./design/context.js";

export async function loadChangeContext(
  projectPath: string,
  changeName: string,
): Promise<ChangeContext> {
  const schema = await resolveSchema();

  const schemaName = schema.name;

  const designContext = new DesignContext(schema);

  const applyContext = new ApplyContext(schema);

  const artifactGraph = new ArtifactGraph(schema);
  const artifacts = artifactGraph.getAllArtifacts();

  const completedArtifacts = await getCompletedArtifacts(projectPath, changeName, artifacts);

  return {
    changeName,
    schemaName,
    designContext,
    applyContext,
    artifactGraph,
    completedArtifacts,
  };
}
