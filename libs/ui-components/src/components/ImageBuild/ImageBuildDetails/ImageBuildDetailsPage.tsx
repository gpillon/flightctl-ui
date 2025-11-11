import * as React from 'react';
import {
  Alert,
  Bullseye,
  Button,
  ButtonVariant,
  Modal,
  ModalVariant,
  Nav,
  NavList,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { RedoIcon } from '@patternfly/react-icons/dist/js/icons/redo-icon';
import { PencilAltIcon } from '@patternfly/react-icons/dist/js/icons/pencil-alt-icon';
import { StopIcon } from '@patternfly/react-icons/dist/js/icons/stop-icon';
import { TrashIcon } from '@patternfly/react-icons/dist/js/icons/trash-icon';

import DetailsPage from '../../DetailsPage/DetailsPage';
import NavItem from '../../NavItem/NavItem';
import { useTranslation } from '../../../hooks/useTranslation';
import { ROUTE, useNavigate } from '../../../hooks/useNavigate';
import { useAppContext } from '../../../hooks/useAppContext';
import { useImageBuild } from './useImageBuild';
import ImageBuildDetailsTab from './ImageBuildDetailsTab';
import ImageBuildLogsTab from './ImageBuildLogsTab';
import ImageBuildContainerfileTab from './ImageBuildContainerfileTab';
import ImageBuildYamlTab from './ImageBuildYamlTab';
import ImageBuildDownloadTab from './ImageBuildDownloadTab';
import { useAccessReview } from '../../../hooks/useAccessReview';
import { RESOURCE, VERB } from '../../../types/rbac';
import PageWithPermissions from '../../common/PageWithPermissions';
import DetailsPageActions from '../../DetailsPage/DetailsPageActions';
import { DropdownItem, DropdownList } from '@patternfly/react-core';
import DeleteImageBuildModal from '../ImageBuildsPage/DeleteImageBuildModal/DeleteImageBuildModal';
import { useFetch } from '../../../hooks/useFetch';
import { getErrorMessage } from '../../../utils/error';
import { PatchRequest } from '@flightctl/types';

const ImageBuildDetailsPage = () => {
  const { post, patch } = useFetch();
  const { t } = useTranslation();
  const {
    router: { useParams, Routes, Route, Navigate },
  } = useAppContext();
  const { buildId } = useParams() as { buildId: string };
  const navigate = useNavigate();
  const [imageBuild, loading, error, refetch] = useImageBuild(buildId);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isRebuildModalOpen, setIsRebuildModalOpen] = React.useState(false);

  const [canDelete] = useAccessReview(RESOURCE.IMAGE_BUILD, VERB.DELETE);
  const [canCreate] = useAccessReview(RESOURCE.IMAGE_BUILD, VERB.CREATE);
  const [canUpdate] = useAccessReview(RESOURCE.IMAGE_BUILD, VERB.UPDATE);

  const [rebuildError, setRebuildError] = React.useState<string | undefined>();
  const [isRebuilding, setIsRebuilding] = React.useState(false);
  const [retryError, setRetryError] = React.useState<string | undefined>();
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [isRetryModalOpen, setIsRetryModalOpen] = React.useState(false);
  const [cancelError, setCancelError] = React.useState<string | undefined>();
  const [isCancelling, setIsCancelling] = React.useState(false);
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleRetry = async () => {
    if (!imageBuild) return;

    setRetryError(undefined);
    setIsRetrying(true);

    try {
      // First, remove cancel annotation if present
      const existingAnnotations = (imageBuild.metadata as any).annotations || {};
      if (existingAnnotations['imagebuilder.flightctl.io/cancel']) {
        const annotationPatchOps: PatchRequest = [
          {
            op: 'remove',
            path: '/metadata/annotations/imagebuilder.flightctl.io~1cancel',
          },
        ];
        await patch(`imagebuilds/${imageBuild.metadata.name}`, annotationPatchOps);
      }

      // Then retry the same build by resetting its status to trigger a new build
      const statusPatchOps: PatchRequest = [
        {
          op: 'replace',
          path: '/status/phase',
          value: 'Pending',
        },
      ];

      // Remove completion time and error message if present
      if (imageBuild.status?.completionTime) {
        statusPatchOps.push({
          op: 'remove',
          path: '/status/completionTime',
        } as any);
      }
      if (imageBuild.status?.message) {
        statusPatchOps.push({
          op: 'remove',
          path: '/status/message',
        } as any);
      }
      if (imageBuild.status?.logs) {
        statusPatchOps.push({
          op: 'remove',
          path: '/status/logs',
        } as any);
      }

      await patch(`imagebuilds/${imageBuild.metadata.name}/status`, statusPatchOps);

      if (!isMountedRef.current) return;

      setIsRetryModalOpen(false);
      refetch();
    } catch (error) {
      if (!isMountedRef.current) return;
      setRetryError(getErrorMessage(error));
    } finally {
      if (isMountedRef.current) {
        setIsRetrying(false);
      }
    }
  };

  const handleRebuild = async () => {
    if (!imageBuild) return;

    setRebuildError(undefined);
    setIsRebuilding(true);

    try {
      // Generate new build name - if it already has -rebuild- suffix, just update the timestamp
      let newBuildName: string;
      const currentName = imageBuild.metadata.name || '';
      const rebuildMatch = currentName.match(/^(.+)-rebuild-(\d+)$/);

      if (rebuildMatch) {
        // Already has rebuild suffix, just update the timestamp
        newBuildName = `${rebuildMatch[1]}-rebuild-${Date.now()}`;
      } else {
        // No rebuild suffix, add it
        newBuildName = `${currentName}-rebuild-${Date.now()}`;
      }

      // Clean up imagebuilder-specific annotations (cancel, retry, etc.)
      const cleanedAnnotations = { ...(imageBuild.metadata as any).annotations };
      if (cleanedAnnotations) {
        Object.keys(cleanedAnnotations).forEach((key) => {
          if (key.startsWith('imagebuilder.flightctl.io/cancel')) {
            delete cleanedAnnotations[key];
          }
        });
      }

      // Trigger a rebuild by creating a new build with the same config
      const newBuild = {
        ...imageBuild,
        metadata: {
          ...imageBuild.metadata,
          name: newBuildName,
          annotations: Object.keys(cleanedAnnotations).length > 0 ? cleanedAnnotations : undefined,
        },
      };

      await post('imagebuilds', newBuild);

      if (!isMountedRef.current) return;

      setIsRebuildModalOpen(false);
      navigate(ROUTE.IMAGE_BUILDS);
    } catch (error) {
      if (!isMountedRef.current) return;
      setRebuildError(getErrorMessage(error));
    } finally {
      if (isMountedRef.current) {
        setIsRebuilding(false);
      }
    }
  };

  const handleCancel = async () => {
    if (!imageBuild) return;

    setCancelError(undefined);
    setIsCancelling(true);

    try {
      // Cancel the build by adding an annotation
      const existingAnnotations = (imageBuild.metadata as any).annotations || {};
      const patchOps: PatchRequest = [
        {
          op: existingAnnotations['imagebuilder.flightctl.io/cancel'] ? 'replace' : 'add',
          path: '/metadata/annotations/imagebuilder.flightctl.io~1cancel',
          value: 'true',
        },
      ];

      // If annotations object doesn't exist, first create it
      if (!(imageBuild.metadata as any).annotations) {
        patchOps.unshift({
          op: 'add',
          path: '/metadata/annotations',
          value: {},
        });
      }

      await patch(`imagebuilds/${imageBuild.metadata.name}`, patchOps);

      if (!isMountedRef.current) return;

      // Refresh to show cancelled status
      refetch();
    } catch (error) {
      if (!isMountedRef.current) return;
      setCancelError(getErrorMessage(error));
    } finally {
      if (isMountedRef.current) {
        setIsCancelling(false);
      }
    }
  };

  return (
    <DetailsPage
      loading={loading}
      error={error}
      id={buildId}
      breadcrumbTitle={imageBuild?.metadata.name}
      title={imageBuild?.metadata.name || buildId}
      resourceLink={ROUTE.IMAGE_BUILDS}
      resourceType="Fleets"
      resourceTypeLabel={t('Image Builder')}
      nav={
        <Nav variant="tertiary">
          <NavList>
            <NavItem to="details">{t('Details')}</NavItem>
            <NavItem to="logs">{t('Logs')}</NavItem>
            <NavItem to="containerfile">{t('Containerfile')}</NavItem>
            <NavItem to="download">{t('Download')}</NavItem>
            <NavItem to="yaml">{t('YAML')}</NavItem>
          </NavList>
        </Nav>
      }
      actions={
        <DetailsPageActions>
          <DropdownList>
            {canUpdate && (
              <DropdownItem
                onClick={() => navigate({ route: ROUTE.IMAGE_BUILD_EDIT, postfix: `${buildId}/edit` })}
                icon={<PencilAltIcon />}
                isDisabled={
                  imageBuild?.status?.phase === 'Building' ||
                  imageBuild?.status?.phase === 'Queued' ||
                  imageBuild?.status?.phase === 'Pending' ||
                  imageBuild?.status?.phase === 'Pushing' ||
                  imageBuild?.status?.phase === 'GeneratingImages'
                }
              >
                {t('Edit build')}
              </DropdownItem>
            )}
            {canUpdate &&
              (imageBuild?.status?.phase === 'Building' ||
                imageBuild?.status?.phase === 'Queued' ||
                imageBuild?.status?.phase === 'Pending' ||
                imageBuild?.status?.phase === 'Pushing' ||
                imageBuild?.status?.phase === 'GeneratingImages') && (
                <DropdownItem onClick={handleCancel} isDisabled={isCancelling} icon={<StopIcon />}>
                  {isCancelling ? t('Cancelling...') : t('Cancel build')}
                </DropdownItem>
              )}
            {canCreate && (imageBuild?.status?.phase === 'Failed' || imageBuild?.status?.phase === 'Completed' || imageBuild?.status?.phase === 'Cancelled') && (
              <>
                <DropdownItem onClick={() => setIsRetryModalOpen(true)} icon={<RedoIcon />}>
                  {t('Rebuild')}
                </DropdownItem>
                <DropdownItem onClick={() => setIsRebuildModalOpen(true)} icon={<RedoIcon />}>
                  {t('Rebuild as new')}
                </DropdownItem>
              </>
            )}
            {canDelete && (
              <DropdownItem onClick={() => setIsDeleteModalOpen(true)} icon={<TrashIcon />}>
                {t('Delete build')}
              </DropdownItem>
            )}
          </DropdownList>
        </DetailsPageActions>
      }
    >
      {imageBuild && (
        <Routes>
          <Route index element={<Navigate to="details" replace />} />
          <Route path="details" element={<ImageBuildDetailsTab imageBuild={imageBuild} refetch={refetch} />} />
          <Route path="logs" element={<ImageBuildLogsTab imageBuild={imageBuild} />} />
          <Route path="containerfile" element={<ImageBuildContainerfileTab imageBuild={imageBuild} refetch={refetch} />} />
          <Route path="download" element={<ImageBuildDownloadTab imageBuild={imageBuild} />} />
          <Route path="yaml" element={<ImageBuildYamlTab imageBuild={imageBuild} refetch={refetch} />} />
        </Routes>
      )}

      {isDeleteModalOpen && (
        <DeleteImageBuildModal
          buildId={buildId}
          onClose={(hasDeleted?: boolean) => {
            if (hasDeleted) {
              navigate(ROUTE.IMAGE_BUILDS);
            }
            setIsDeleteModalOpen(false);
          }}
        />
      )}

      {/* Retry confirmation modal */}
      <Modal
        title={t('Retry build')}
        variant={ModalVariant.small}
        isOpen={isRetryModalOpen}
        onClose={() => {
          setIsRetryModalOpen(false);
          setRetryError(undefined);
        }}
        actions={[
          <Button
            key="retry"
            variant={ButtonVariant.primary}
            onClick={handleRetry}
            isDisabled={isRetrying}
            isLoading={isRetrying}
          >
            {t('Retry')}
          </Button>,
          <Button
            key="cancel"
            variant={ButtonVariant.link}
            onClick={() => {
              setIsRetryModalOpen(false);
              setRetryError(undefined);
            }}
          >
            {t('Cancel')}
          </Button>,
        ]}
      >
        <Stack hasGutter>
          <StackItem>{t('Are you sure you want to retry this build? The same build will be restarted.')}</StackItem>
          {retryError && (
            <StackItem>
              <Alert variant="danger" isInline title={t('An error occurred')}>
                {retryError}
              </Alert>
            </StackItem>
          )}
        </Stack>
      </Modal>

      {/* Rebuild as new confirmation modal */}
      <Modal
        variant={ModalVariant.small}
        title={t('Rebuild image')}
        isOpen={isRebuildModalOpen}
        onClose={() => setIsRebuildModalOpen(false)}
        actions={[
          <Button
            key="rebuild"
            variant={ButtonVariant.primary}
            onClick={handleRebuild}
            isLoading={isRebuilding}
            isDisabled={isRebuilding}
          >
            {t('Rebuild')}
          </Button>,
          <Button
            key="cancel"
            variant={ButtonVariant.link}
            onClick={() => setIsRebuildModalOpen(false)}
            isDisabled={isRebuilding}
          >
            {t('Cancel')}
          </Button>,
        ]}
      >
        <Stack hasGutter>
          {rebuildError && (
            <StackItem>
              <Alert variant="danger" title={t('Error')} isInline>
                {rebuildError}
              </Alert>
            </StackItem>
          )}
          <StackItem>
            {t('This will create a new build using the current Containerfile configuration.')}
          </StackItem>
          <StackItem>
            <Alert variant="info" title={t('Note')} isInline>
              {t('A new build with a timestamped name will be created. The original build will remain unchanged.')}
            </Alert>
          </StackItem>
        </Stack>
      </Modal>
    </DetailsPage>
  );
};

const ImageBuildDetailsPageWithPermissions = () => {
  const [allowed, loading] = useAccessReview(RESOURCE.IMAGE_BUILD, VERB.GET);
  return (
    <PageWithPermissions allowed={allowed} loading={loading}>
      <ImageBuildDetailsPage />
    </PageWithPermissions>
  );
};

export default ImageBuildDetailsPageWithPermissions;

