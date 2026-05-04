import { resolveSchema } from "./artifact/schema/resolver.js";
import type { ChangeContext } from "./types.js";
import { ArtifactGraph } from "./artifact/graph.js";
import { getCompletedArtifacts } from "./artifact/completion.js";

export async function loadChangeContext(
  projectPath: string,
  changeName: string,
): Promise<ChangeContext> {
  const schema = await resolveSchema();

  const schemaName = schema.name;
  const apply = schema.apply;

  const artifactGraph = new ArtifactGraph(schema);
  const artifacts = artifactGraph.getAllArtifacts();

  const completedArtifacts = await getCompletedArtifacts(projectPath, changeName, artifacts);

  return {
    changeName,
    schemaName,
    apply,
    artifactGraph,
    completedArtifacts,
  };
}
