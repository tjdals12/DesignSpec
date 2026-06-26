export interface LegacyDetectionResult {
  skillDirs: string[];
  commandDirs: string[];
  commandFiles: string[];
  hasLegacyArtifacts: boolean;
}

export interface CleanupError {
  path: string;
  message: string;
}

export interface CleanupResult {
  removed: string[];
  errors: CleanupError[];
}
