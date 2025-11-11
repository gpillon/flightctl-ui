import * as React from 'react';
import { ActionsColumn, IAction, OnSelect, Td, Tr } from '@patternfly/react-table';
import { useTranslation } from '../../hooks/useTranslation';
import { ROUTE, useNavigate } from '../../hooks/useNavigate';
import { ImageBuild } from './useImageBuilds';
import ImageBuildStatus from './ImageBuildStatus';
import ResourceLink from '../common/ResourceLink';
import { getDateDisplay } from '../../utils/dates';

type ImageBuildRowProps = {
  imageBuild: ImageBuild;
  rowIndex: number;
  onRowSelect: (imageBuild: ImageBuild) => OnSelect;
  isRowSelected: (imageBuild: ImageBuild) => boolean;
  onDeleteClick: () => void;
  canDelete: boolean;
};

const useImageBuildActions = (buildName: string, canDelete: boolean, onDeleteClick: () => void) => {
  const actions: IAction[] = [];
  const navigate = useNavigate();
  const { t } = useTranslation();

  actions.push({
    title: t('View build details'),
    onClick: () => navigate({ route: ROUTE.IMAGE_BUILD_DETAILS, postfix: buildName }),
  });

  if (canDelete) {
    actions.push({
      title: t('Delete build'),
      onClick: onDeleteClick,
    });
  }

  return actions;
};

const ImageBuildRow: React.FC<ImageBuildRowProps> = ({
  imageBuild,
  rowIndex,
  onRowSelect,
  isRowSelected,
  onDeleteClick,
  canDelete,
}) => {
  const { t } = useTranslation();
  const buildName = imageBuild.metadata.name || '';
  const actions = useImageBuildActions(buildName, canDelete, onDeleteClick);

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '-';
    return getDateDisplay(timestamp);
  };

  return (
    <Tr>
      <Td
        select={{
          rowIndex,
          onSelect: onRowSelect(imageBuild),
          isSelected: isRowSelected(imageBuild),
        }}
      />
      <Td dataLabel={t('Name')}>
        <ResourceLink id={buildName} routeLink={ROUTE.IMAGE_BUILD_DETAILS} />
      </Td>
      <Td dataLabel={t('Base Image')}>{imageBuild.spec.baseImage || '-'}</Td>
      <Td dataLabel={t('Status')}>
        <ImageBuildStatus imageBuild={imageBuild} />
      </Td>
      <Td dataLabel={t('Created')}>{formatTimestamp(imageBuild.metadata.creationTimestamp)}</Td>
      <Td dataLabel={t('Completed')}>
        {imageBuild.status?.completionTime ? formatTimestamp(imageBuild.status.completionTime) : '-'}
      </Td>
      {!!actions.length && (
        <Td isActionCell>
          <ActionsColumn items={actions} />
        </Td>
      )}
    </Tr>
  );
};

export default ImageBuildRow;

