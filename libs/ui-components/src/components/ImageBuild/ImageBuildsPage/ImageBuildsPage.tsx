import * as React from 'react';
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownItem,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Badge,
} from '@patternfly/react-core';
import { Tbody } from '@patternfly/react-table';
import { BuildIcon } from '@patternfly/react-icons/dist/js/icons/build-icon';
import { TFunction } from 'i18next';

import ListPage from '../../ListPage/ListPage';
import ListPageBody from '../../ListPage/ListPageBody';
import TablePagination from '../../Table/TablePagination';
import TableTextSearch from '../../Table/TableTextSearch';
import Table, { ApiSortTableColumn } from '../../Table/Table';
import { useTableSelect } from '../../../hooks/useTableSelect';
import { getResourceId } from '../../../utils/resource';
import MassDeleteImageBuildModal from '../modals/MassDeleteImageBuildModal/MassDeleteImageBuildModal';
import ImageBuildRow from '../ImageBuildRow';
import ResourceListEmptyState from '../../common/ResourceListEmptyState';
import { useTranslation } from '../../../hooks/useTranslation';
import { ROUTE, useNavigate } from '../../../hooks/useNavigate';
import DeleteImageBuildModal from './DeleteImageBuildModal/DeleteImageBuildModal';
import { useImageBuildBackendFilters, useImageBuilds, ImageBuildStatus } from '../useImageBuilds';
import { useAccessReview } from '../../../hooks/useAccessReview';
import { RESOURCE, VERB } from '../../../types/rbac';
import PageWithPermissions from '../../common/PageWithPermissions';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';

const ImageBuildPageActions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [canCreate] = useAccessReview(RESOURCE.IMAGE_BUILD, VERB.CREATE);
  const [isOpen, setIsOpen] = React.useState(false);

  if (!canCreate) {
    return null;
  }

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={(isOpen) => setIsOpen(isOpen)}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          onClick={() => setIsOpen(!isOpen)}
          isExpanded={isOpen}
          variant="primary"
        >
          {t('Create Image Build')}
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem isDisabled={true} onClick={() => {
          setIsOpen(false);
          navigate(ROUTE.IMAGE_BUILD_CREATE_YAML);
        }}>
          {t('Create from YAML')} &nbsp;
          <Badge isRead>
            WIP
          </Badge>
        </DropdownItem>
        <DropdownItem isDisabled={true} onClick={() => {
          setIsOpen(false);
          navigate(ROUTE.IMAGE_BUILD_CREATE_CONTAINERFILE);
        }}>
          {t('Create from Containerfile')}  &nbsp;
          <Badge isRead>
            WIP
          </Badge>
        </DropdownItem>
        <DropdownItem onClick={() => {
          setIsOpen(false);
          navigate(ROUTE.IMAGE_BUILD_CREATE);
        }}>
          {t('Create with Wizard')}
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

const ImageBuildEmptyState = () => {
  const { t } = useTranslation();
  return (
    <ResourceListEmptyState icon={BuildIcon} titleText={t('No image builds yet')}>
      <EmptyStateBody>
        {t('Create custom container images from base images, customize them with packages and configurations, and push them to container registries.')}
      </EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <ImageBuildPageActions />
        </EmptyStateActions>
      </EmptyStateFooter>
    </ResourceListEmptyState>
  );
};

const getColumns = (t: TFunction): ApiSortTableColumn[] => [
  {
    name: t('Name'),
  },
  {
    name: t('Base Image'),
  },
  {
    name: t('Status'),
  },
  {
    name: t('Created'),
  },
  {
    name: t('Completed'),
  },
];

const ImageBuildTable = () => {
  const { t } = useTranslation();

  const imageBuildColumns = React.useMemo(() => getColumns(t), [t]);
  const { name, setName, status, setStatus, hasFiltersEnabled } = useImageBuildBackendFilters();

  const { imageBuilds, isLoading, error, isUpdating, refetch, pagination } = useImageBuilds({
    name,
    status,
  });

  const [isMassDeleteModalOpen, setIsMassDeleteModalOpen] = React.useState(false);
  const [buildToDeleteId, setBuildToDeleteId] = React.useState<string>();
  const [statusSelectOpen, setStatusSelectOpen] = React.useState(false);

  const { onRowSelect, isAllSelected, hasSelectedRows, isRowSelected, setAllSelected } = useTableSelect();

  const [canDelete] = useAccessReview(RESOURCE.IMAGE_BUILD, VERB.DELETE);
  const [canCreate] = useAccessReview(RESOURCE.IMAGE_BUILD, VERB.CREATE);

  const statusOptions = [
    { value: ImageBuildStatus.QUEUED, label: t('Queued') },
    { value: ImageBuildStatus.BUILDING, label: t('Building') },
    { value: ImageBuildStatus.COMPLETED, label: t('Completed') },
    { value: ImageBuildStatus.FAILED, label: t('Failed') },
    { value: ImageBuildStatus.CANCELLED, label: t('Cancelled') },
  ];

  return (
    <ListPageBody error={error} loading={isLoading}>
      <Toolbar inset={{ default: 'insetNone' }}>
        <ToolbarContent>
          <ToolbarGroup>
            <ToolbarItem variant="search-filter">
              <TableTextSearch value={name || ''} setValue={setName} placeholder={t('Search by name')} />
            </ToolbarItem>
            <ToolbarItem>
              <Select
                aria-label={t('Filter by status')}
                isOpen={statusSelectOpen}
                onSelect={(_, value) => {
                  setStatus(value as ImageBuildStatus);
                  setStatusSelectOpen(false);
                }}
                onOpenChange={(isOpen) => setStatusSelectOpen(isOpen)}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setStatusSelectOpen(!statusSelectOpen)}
                    isExpanded={statusSelectOpen}
                    isFullWidth
                  >
                    {status ? statusOptions.find((o) => o.value === status)?.label : t('Filter by status')}
                  </MenuToggle>
                )}
              >
                <SelectList>
                  <SelectOption key="all" value={undefined} onClick={() => setStatus(undefined)}>
                    {t('All statuses')}
                  </SelectOption>
                  {statusOptions.map((option) => (
                    <SelectOption key={option.value} value={option.value}>
                      {option.label}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </ToolbarItem>
          </ToolbarGroup>
          {canCreate && (
            <ToolbarItem>
              <ImageBuildPageActions />
            </ToolbarItem>
          )}
          {canDelete && (
            <ToolbarItem>
              <Button isDisabled={!hasSelectedRows} onClick={() => setIsMassDeleteModalOpen(true)} variant="secondary">
                {t('Delete builds')}
              </Button>
            </ToolbarItem>
          )}
        </ToolbarContent>
      </Toolbar>
      <Table
        aria-label={t('Image builds table')}
        loading={isUpdating}
        columns={imageBuildColumns}
        hasFilters={hasFiltersEnabled}
        emptyData={imageBuilds.length === 0}
        clearFilters={() => {
          setName('');
          setStatus(undefined);
        }}
        isAllSelected={isAllSelected}
        onSelectAll={setAllSelected}
      >
        <Tbody>
          {imageBuilds.map((imageBuild, rowIndex) => (
            <ImageBuildRow
              key={getResourceId(imageBuild)}
              imageBuild={imageBuild}
              rowIndex={rowIndex}
              canDelete={canDelete}
              onDeleteClick={() => {
                setBuildToDeleteId(imageBuild.metadata.name || '');
              }}
              isRowSelected={isRowSelected}
              onRowSelect={onRowSelect}
            />
          ))}
        </Tbody>
      </Table>
      <TablePagination pagination={pagination} isUpdating={isUpdating} />
      {!isUpdating && imageBuilds.length === 0 && !name && !status && <ImageBuildEmptyState />}
      {buildToDeleteId && (
        <DeleteImageBuildModal
          buildId={buildToDeleteId}
          onClose={(hasDeleted?: boolean) => {
            if (hasDeleted) {
              refetch();
            }
            setBuildToDeleteId(undefined);
          }}
        />
      )}
      {isMassDeleteModalOpen && (
        <MassDeleteImageBuildModal
          onClose={() => setIsMassDeleteModalOpen(false)}
          imageBuilds={imageBuilds.filter(isRowSelected)}
          onDeleteSuccess={() => {
            setIsMassDeleteModalOpen(false);
            refetch();
          }}
        />
      )}
    </ListPageBody>
  );
};

const ImageBuildsPage = () => {
  const { t } = useTranslation();

  return (
    <ListPage title={t('Image Builder')}>
      <ImageBuildTable />
    </ListPage>
  );
};

const ImageBuildsPageWithPermissions = () => {
  const [allowed, loading] = useAccessReview(RESOURCE.IMAGE_BUILD, VERB.LIST);
  return (
    <PageWithPermissions allowed={allowed} loading={loading}>
      <ImageBuildsPage />
    </PageWithPermissions>
  );
};

export default ImageBuildsPageWithPermissions;

