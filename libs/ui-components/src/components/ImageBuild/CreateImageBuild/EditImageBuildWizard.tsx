import * as React from 'react';
import { useAppContext } from '../../../hooks/useAppContext';
import CreateImageBuildWizard from './CreateImageBuildWizard';

const EditImageBuildWizard = () => {
  const {
    router: { useParams },
  } = useAppContext();
  const { buildId } = useParams() as { buildId: string };
  
  return <CreateImageBuildWizard buildId={buildId} />;
};

export default EditImageBuildWizard;

