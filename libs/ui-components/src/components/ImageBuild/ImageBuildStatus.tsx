import * as React from 'react';
import { Label } from '@patternfly/react-core';
import { CheckCircleIcon, ExclamationCircleIcon, InProgressIcon, PendingIcon, TimesCircleIcon } from '@patternfly/react-icons';
import { ImageBuild, ImageBuildStatus as BuildStatus } from './useImageBuilds';
import { useTranslation } from '../../hooks/useTranslation';

type ImageBuildStatusProps = {
  imageBuild: ImageBuild;
};

const ImageBuildStatus: React.FC<ImageBuildStatusProps> = ({ imageBuild }) => {
  const { t } = useTranslation();
  const status = imageBuild.status?.phase || BuildStatus.QUEUED;
  const message = imageBuild.status?.message;

  const getStatusLabel = () => {
    switch (status) {
      case BuildStatus.COMPLETED:
        return {
          color: 'green' as const,
          icon: <CheckCircleIcon />,
          text: t('Completed'),
        };
      case BuildStatus.BUILDING:
        return {
          color: 'blue' as const,
          icon: <InProgressIcon />,
          text: t('Building'),
        };
      case BuildStatus.PUSHING:
        return {
          color: 'blue' as const,
          icon: <InProgressIcon />,
          text: t('Pushing'),
        };
      case BuildStatus.GENERATING_IMAGES:
        return {
          color: 'blue' as const,
          icon: <InProgressIcon />,
          text: t('Generating Images'),
        };
      case BuildStatus.FAILED:
        return {
          color: 'red' as const,
          icon: <ExclamationCircleIcon />,
          text: t('Failed'),
        };
      case BuildStatus.CANCELLED:
        return {
          color: 'orange' as const,
          icon: <TimesCircleIcon />,
          text: t('Cancelled'),
        };
      case BuildStatus.PENDING:
      case BuildStatus.QUEUED:
      default:
        return {
          color: 'grey' as const,
          icon: <PendingIcon />,
          text: t('Queued'),
        };
    }
  };

  const statusInfo = getStatusLabel();

  return (
    <Label color={statusInfo.color} icon={statusInfo.icon} title={message}>
      {statusInfo.text}
      {imageBuild.status?.progress !== undefined && 
       (status === BuildStatus.BUILDING || status === BuildStatus.PUSHING || status === BuildStatus.GENERATING_IMAGES) && (
        <> ({imageBuild.status.progress}%)</>
      )}
    </Label>
  );
};

export default ImageBuildStatus;

