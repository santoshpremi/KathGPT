// backend/src/api/chat/artifact/artifactTypes.ts
export interface ArtifactVersion {
  id: string;
  content: string;
  createdAt: string;
  fromChat: boolean;
  version: number;
}

export interface Artifact {
  type: string;
  id: string;
  title: string;
  versions: ArtifactVersion[];
}


export type CreateVersionResponse = AsyncGenerator<
  { type: "init"; newVersionId: string } | { type: "chunk"; chunk: string },
  void,
  unknown
>;
