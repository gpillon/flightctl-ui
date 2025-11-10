import * as React from 'react';
import {
  Alert,
  Button,
  Progress,
  ProgressMeasureLocation,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@patternfly/react-core/next';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { getErrorMessage } from '../../../../utils/error';
import { useFetch } from '../../../../hooks/useFetch';
import { useTranslation } from '../../../../hooks/useTranslation';
import { isPromiseRejected } from '../../../../types/typeUtils';
import { ImageBuild } from '../../useImageBuilds';

type MassDeleteImageBuildModalProps = {
  onClose: VoidFunction;
  imageBuilds: Array<ImageBuild>;
  onDeleteSuccess: VoidFunction;
};

const MassDeleteImageBuildTable = ({ imageBuilds }: { imageBuilds: Array<ImageBuild> }) => {
  const { t } = useTranslation();
  return (
    <Table>
      <Thead>
        <Tr>
          <Th modifier="fitContent">{t('Name')}</Th>
          <Th modifier="fitContent">{t('Status')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {imageBuilds.map((build) => {
          const name = build.metadata.name || '';
          return (
            <Tr key={name}>
              <Td dataLabel={t('Name')}>{name}</Td>
              <Td dataLabel={t('Status')}>{build.status?.phase || '-'}</Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

const MassDeleteImageBuildModal: React.FC<MassDeleteImageBuildModalProps> = ({
  onClose,
  imageBuilds,
  onDeleteSuccess,
}) => {
  const { t } = useTranslation();
  const [progress, setProgress] = React.useState(0);
  const [progressTotal, setProgressTotal] = React.useState(0);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>();
  const { remove } = useFetch();

  const deleteBuilds = async () => {
    setProgress(0);
    setIsDeleting(true);
    const promises = imageBuilds.map(async (build) => {
      const buildId = build.metadata.name || '';
      await remove(`imagebuilds/${buildId}`);
      setProgress((p) => p + 1);
    });

    setProgressTotal(promises.length);
    const results = await Promise.allSettled(promises);
    setIsDeleting(false);

    const rejectedResults = results.filter(isPromiseRejected);

    if (rejectedResults.length) {
      setErrors(rejectedResults.map((r) => getErrorMessage(r.reason)));
    } else {
      onDeleteSuccess();
    }
  };

  return (
    <Modal isOpen onClose={isDeleting ? undefined : onClose} variant="medium">
      <ModalHeader title={t('Delete image builds?')} titleIconVariant="warning" />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            {t('The following image builds will be deleted permanently. Are you sure you want to delete the listed builds?')}
          </StackItem>
          <StackItem>
            <MassDeleteImageBuildTable imageBuilds={imageBuilds} />
          </StackItem>

          {isDeleting && (
            <StackItem>
              <Progress
                value={progress}
                min={0}
                max={progressTotal}
                title={t('Deleting...')}
                measureLocation={ProgressMeasureLocation.top}
                label={t('{{progress}} of {{progressTotal}}', { progress, progressTotal })}
                valueText={t('{{progress}} of {{progressTotal}}', { progress, progressTotal })}
              />
            </StackItem>
          )}
          {errors?.length && (
            <StackItem>
              <Alert isInline variant="danger" title={t('An error occurred')}>
                <Stack hasGutter>
                  {errors.map((e, index) => (
                    <StackItem key={index}>{e}</StackItem>
                  ))}
                </Stack>
              </Alert>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button key="delete" variant="danger" onClick={deleteBuilds} isLoading={isDeleting} isDisabled={isDeleting}>
          {t('Delete builds')}
        </Button>
        <Button key="cancel" variant="link" onClick={onClose} isDisabled={isDeleting}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default MassDeleteImageBuildModal;

