import type { ChangeContext } from "../types.js";
import { buildChangeDirPath } from "../paths.js";
import { resolveProjectContext } from "../../project-config/resolver.js";
import type { DesignInstructions, SpecFile } from "./types.js";
import { collectSpecs, readSpec } from "./specs.js";

export async function resolveDesignInstructions(
  projectPath: string,
  changeContext: ChangeContext,
): Promise<DesignInstructions> {
  const { changeName, schemaName, completedArtifacts, designContext, artifactGraph } =
    changeContext;

  const changeDirPath = buildChangeDirPath(projectPath, changeName);
  const projectContext = await resolveProjectContext(projectPath);

  const designResult = designContext.resolve(completedArtifacts);

  const screensArtifact = artifactGraph.getArtifact("screens");
  let screens: string | null = null;
  if (screensArtifact) {
    screens = readSpec(changeDirPath, screensArtifact.generates);
  }

  const componentsArtifact = artifactGraph.getArtifact("components");
  let components: SpecFile[] = [];
  if (componentsArtifact) {
    components = collectSpecs(changeDirPath, componentsArtifact.generates);
  }

  const pagesArtifact = artifactGraph.getArtifact("pages");
  let pages: SpecFile[] = [];
  if (pagesArtifact) {
    pages = collectSpecs(changeDirPath, pagesArtifact.generates);
  }

  return {
    changeName,
    schemaName,
    changeDirPath,
    ...(projectContext ? { projectContext } : {}),
    design: {
      ...designResult,
      ...(screens ? { screens } : {}),
      components,
      pages,
    },
  };
}
