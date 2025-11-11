import * as React from 'react';
import { useFetchPeriodically } from '../../../hooks/useFetchPeriodically';
import { ImageBuild } from '../useImageBuilds';

export const useImageBuild = (buildId: string): [ImageBuild | undefined, boolean, unknown, VoidFunction] => {
  const [imageBuild, isLoading, error, refetch] = useFetchPeriodically<ImageBuild>({
    endpoint: buildId ? `imagebuilds/${buildId}` : '',
  });

  return [imageBuild, isLoading, error, refetch];
};

