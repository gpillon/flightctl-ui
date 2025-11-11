import * as React from 'react';
import { ImageBuild } from '../useImageBuilds';

import YamlEditor from '../../common/CodeEditor/YamlEditor';

const ImageBuildYamlTab = ({ imageBuild, refetch }: { imageBuild: ImageBuild; refetch: VoidFunction }) => {
  // @ts-expect-error - ImageBuild is not yet in the FlightCtlYamlResource type, but YamlEditor can handle it
  return <YamlEditor apiObj={imageBuild} refetch={refetch} disabledEditReason="ImageBuild resources are read-only" />;
};

export default ImageBuildYamlTab;

