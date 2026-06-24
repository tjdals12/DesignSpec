import type { ProjectContext } from "../../project-config/types.js";

export interface SpecFile {
  name: string;
  spec: string;
}

export interface DesignResult {
  missingArtifacts: string[];
  instruction: string;
}

export interface DesignInstructions {
  changeName: string;
  schemaName: string;
  changeDirPath: string;
  projectContext?: ProjectContext;
  design: DesignResult & {
    screens?: string;
    components: SpecFile[];
    pages: SpecFile[];
  };
}
